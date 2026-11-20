import {
    analyze,
    type AnalyzeOptions,
    type ImplicitLibVariableOptions,
} from "@typescript-eslint/scope-manager";
import type {
    Lib,
    TSESTree,
} from "@typescript-eslint/types";
import path from "node:path";
import { ScriptTarget } from "../../enums/scriptTarget.js";
import type { LintConfiguration } from "./config.ts";
import { nativeLibraryDefinitions } from "./nativeLibraries.ts";
import type { NativeAPIContext } from "./types.ts";

const programLibraries = new WeakMap<NativeAPIContext["project"]["program"], string[]>();

function normalizeLib(name: string): string {
    const base = path.basename(name).toLowerCase();
    return base === "lib.d.ts" ? "lib" : base.replace(/^lib\./u, "").replace(/\.d\.ts$/u, "");
}

export function scopeLibraries(configuration: LintConfiguration, context: NativeAPIContext | undefined): string[] {
    const options = configuration.compilerOptions;
    if (context?.defaultLibraries !== undefined) return context.defaultLibraries.map(normalizeLib);
    if (context) {
        const program = context.program ?? context.project.program;
        let libs = programLibraries.get(program);
        if (!libs) {
            libs = program.getSourceFileNames()
                .filter(name => /^lib(?:\..+)?\.d\.ts$/iu.test(path.basename(name)) && program.getSourceFileMetadata(name)?.isDefaultLibrary)
                .map(normalizeLib);
            programLibraries.set(program, libs);
        }
        return libs;
    }
    if (options?.noLib) return [];
    if (options?.lib) return options.lib.map(normalizeLib);
    // Standalone native ASTs do not carry a program's resolved default libraries.
    const target = options?.target ?? ScriptTarget.ES2026;
    if (target === ScriptTarget.ES2015) return ["es2015", "dom", "dom.iterable", "webworker.importscripts", "scripthost"];
    const name = ScriptTarget[target]?.toLowerCase();
    if (!name || target === ScriptTarget.JSON) throw new Error(`Unsupported native lint script target: ${target}`);
    return [`${name === "latest" ? "esnext" : name}.full`];
}

export function analyzeScopes(ast: TSESTree.Program, options: Omit<AnalyzeOptions, "lib"> & { lib?: readonly string[] | undefined; }): ReturnType<typeof analyze> {
    const supported = new Set<Lib>();
    const variables = new Map<string, ImplicitLibVariableOptions>();
    const visited = new Set<string>();
    function include(name: string): void {
        if (visited.has(name)) return;
        visited.add(name);
        const definition = Object.hasOwn(nativeLibraryDefinitions, name) ? nativeLibraryDefinitions[name] : undefined;
        if (!definition) {
            supported.add(name as Lib);
            return;
        }
        for (const dependency of definition.libs) include(dependency);
        for (const [name, flags] of definition.variables) variables.set(name, flags);
    }
    for (const name of options.lib ?? ["esnext"]) include(name);
    let manager: ReturnType<typeof analyze>;
    try {
        manager = analyze(ast, { ...options, lib: [...supported] });
    }
    catch (error) {
        const missing = error instanceof Error ? /^Invalid value for lib provided: (\S+)$/u.exec(error.message)?.[1] : undefined;
        if (missing) throw new Error(`Native lint scope analysis does not support compiler library "${missing}"`, { cause: error });
        throw error;
    }
    const global = manager.globalScope;
    if (!global) throw new Error("Native lint scope analysis did not create a global scope");
    for (const [name, flags] of variables) {
        if (!global.set.has(name)) global.defineImplicitVariable(name, flags);
    }
    // These are implicit library variables, not ESLint configured globals.
    // addGlobals would incorrectly resolve value references to type-only names.
    global.through = global.through.filter(reference => {
        if (!variables.has(reference.identifier.name)) return true;
        const variable = global.set.get(reference.identifier.name)!;
        if (!(reference.isTypeReference && variable.isTypeVariable || reference.isValueReference && variable.isValueVariable)) return true;
        reference.resolved = variable;
        variable.references.push(reference);
        return false;
    });
    return manager;
}
