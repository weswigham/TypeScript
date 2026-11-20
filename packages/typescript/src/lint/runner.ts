import type { TSESTree } from "@typescript-eslint/types";
import type {
    AST,
    Rule,
    Scope,
    SourceCode,
} from "eslint";
import { Linter } from "eslint/universal";
import { performance } from "node:perf_hooks";
import { ModuleKind } from "../../enums/moduleKind.js";
import {
    LanguageVariant,
    type SourceFile,
} from "../ast/index.ts";
import type { LintConfiguration } from "./config.ts";
import { convertSourceFile } from "./estree/index.ts";
import type { ParserServices } from "./plugin.ts";
import {
    type FileRuleState,
    isolateRules,
} from "./ruleIsolation.ts";
import {
    analyzeScopes,
    scopeLibraries,
} from "./scope.ts";
import { NativeSourceCode } from "./sourceCode.ts";
import {
    type FileTimings,
    type Fix,
    type LintMessage,
    type NativeAPIContext,
} from "./types.ts";
import { record } from "./validation.ts";

const emptyGlobals: Linter.Globals = Object.freeze({});
const preparedConfigurations = new WeakMap<LintConfiguration, Map<string, PreparedConfiguration>>();
const visitorKeyCache = new WeakMap<object, SourceCode.VisitorKeys>();
type SourceType = "module" | "script" | "commonjs";

function assertProgram(value: unknown): asserts value is AST.Program {
    const ast = record(value, "Converted ESTree program");
    if (ast.type !== "Program" || !Array.isArray(ast.body) || !Array.isArray(ast.tokens) || !Array.isArray(ast.comments) || !Array.isArray(ast.range) || !ast.loc) {
        throw new Error("Converted ESTree program must include body, tokens, comments, range, and locations");
    }
}

function assertScopeManager(value: unknown): asserts value is Scope.ScopeManager {
    const scope = record(value, "TypeScript scope manager");
    if (!Array.isArray(scope.scopes) || !scope.globalScope || typeof scope.acquire !== "function" || typeof scope.getDeclaredVariables !== "function" || typeof scope.addGlobals !== "function") {
        throw new Error("TypeScript scope manager does not implement the ESLint 10 scope contract, including addGlobals");
    }
}

function globalComments(comments: readonly TSESTree.Comment[]): Linter.Globals {
    const globals: Linter.Globals = Object.create(null) as Linter.Globals;
    for (const comment of comments) {
        if (comment.type !== "Block") continue;
        const directive = /^\s*globals?\s+([\s\S]*)$/u.exec(comment.value);
        if (!directive) continue;
        const content = directive[1].split(/\s--(?:\s|$)/u, 1)[0];
        const pattern = /([^\s,:]+)\s*(?::\s*([^\s,]+))?/gu;
        for (const match of content.matchAll(pattern)) {
            const name = match[1];
            const value = match[2] ?? "readonly";
            if (value === "true" || value === "writable" || value === "writeable") globals[name] = "writable";
            else if (value === "false" || value === "readonly" || value === "readable") globals[name] = "readonly";
            else if (value === "off") globals[name] = "off";
            else throw new Error(`Invalid global declaration "${name}:${value}" at line ${comment.loc.start.line}`);
        }
    }
    return globals;
}

function checkedFix(fix: Rule.Fix, length: number, bomOffset: number): Fix {
    const [start, end] = fix.range;
    if (start === -1 && end === 0 && typeof fix.text === "string") return { range: [0, bomOffset], text: fix.text };
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || end > length || typeof fix.text !== "string") {
        throw new Error(`Rule returned an invalid fix range [${start}, ${end}] for source length ${length}`);
    }
    return { range: [start + bomOffset, end + bomOffset], text: fix.text };
}

function diagnostics(messages: Linter.LintMessage[], source: SourceCode, bomOffset: number): LintMessage[] {
    return messages.map(message => {
        if (message.ruleId === null || message.fatal) throw new Error(`ESLint could not lint the native AST: ${message.message}`);
        if (message.severity !== 1 && message.severity !== 2) throw new Error(`ESLint returned invalid diagnostic severity ${message.severity}`);
        const start = source.getIndexFromLoc({ line: message.line, column: message.column - 1 });
        const end = message.endLine === undefined || message.endColumn === undefined
            ? start
            : source.getIndexFromLoc({ line: message.endLine, column: message.endColumn - 1 });
        if (start < 0 || end < start || end > source.text.length) throw new Error(`Rule "${message.ruleId}" returned an invalid diagnostic range`);
        const result: LintMessage = {
            ruleId: message.ruleId,
            severity: message.severity,
            message: message.message,
            start: start + bomOffset,
            end: end + bomOffset,
        };
        if (message.messageId !== undefined) result.messageId = message.messageId;
        if (message.fix !== undefined) result.fix = checkedFix(message.fix, source.text.length, bomOffset);
        if (message.suggestions !== undefined) {
            result.suggestions = message.suggestions.map(suggestion => ({
                desc: suggestion.desc,
                fix: checkedFix(suggestion.fix, source.text.length, bomOffset),
            }));
        }
        return result;
    });
}

class NativeASTParser {
    readonly meta: { name: string; } = { name: "@typescript/native-lint" };

    readonly parseForESLint: () => Linter.ESLintParseResult = () => {
        throw new Error("Native lint requires a supplied native SourceCode; reparsing text is unsupported");
    };
}

interface PreparedConfiguration {
    configs: Linter.Config[];
    parser: NativeASTParser;
}

function prepare(configuration: LintConfiguration, sourceType: SourceType, globals: Linter.Globals, jsx: boolean): PreparedConfiguration {
    const parser = new NativeASTParser();
    return {
        parser,
        configs: [{
            ignores: ["!**"],
        }, {
            files: ["**"],
            plugins: configuration.plugins,
            languageOptions: {
                parser,
                ecmaVersion: "latest",
                sourceType,
                globals: globals === emptyGlobals ? configuration.globals : { ...configuration.globals, ...globals },
                parserOptions: { ecmaFeatures: { jsx } },
            },
            rules: configuration.rules,
            linterOptions: { reportUnusedDisableDirectives: "off" },
        }],
    };
}

function getPrepared(configuration: LintConfiguration, sourceType: SourceType, globals: Linter.Globals, jsx = false): PreparedConfiguration {
    let variants = preparedConfigurations.get(configuration);
    if (!variants) preparedConfigurations.set(configuration, variants = new Map());
    const key = `${sourceType}:${jsx}:${globals === emptyGlobals ? "" : JSON.stringify(globals)}`;
    let prepared = variants.get(key);
    if (!prepared) {
        if (variants.size >= 32) variants.delete(variants.keys().next().value!);
        prepared = prepare(configuration, sourceType, globals, jsx);
        variants.set(key, prepared);
    }
    return prepared;
}

export function prepareConfiguration(configuration: LintConfiguration): void {
    getPrepared(configuration, configuration.compilerOptions?.sourceType ?? "module", emptyGlobals);
}

function eslintVisitorKeys(value: Readonly<Record<string, readonly string[] | undefined>>): SourceCode.VisitorKeys {
    let cached = visitorKeyCache.get(value);
    if (!cached) {
        cached = Object.create(null) as SourceCode.VisitorKeys;
        for (const [type, keys] of Object.entries(value)) {
            if (keys !== undefined) cached[type] = [...keys];
        }
        visitorKeyCache.set(value, cached);
    }
    return cached;
}

function parserServices(converted: ReturnType<typeof convertSourceFile>, nativeAPIContext: NativeAPIContext | undefined): ParserServices {
    function context(): NativeAPIContext {
        if (!nativeAPIContext) throw new Error("Typed lint services require a supplied native API context with an attached project/checker");
        return nativeAPIContext;
    }
    function nativeNode(node: TSESTree.Node): import("../ast/index.ts").Node {
        const native = converted.esTreeNodeToTSNodeMap.get(node);
        if (!native) throw new Error("The ESTree node has no native TypeScript mapping");
        return native;
    }
    function checker(): NativeAPIContext["project"]["checker"] {
        const native = context();
        return native.checker ?? native.project.checker;
    }
    return {
        esTreeNodeToTSNodeMap: converted.esTreeNodeToTSNodeMap,
        tsNodeToESTreeNodeMap: converted.tsNodeToESTreeNodeMap,
        hasFullTypeInformation: nativeAPIContext !== undefined,
        nativeAPIContext,
        get api() {
            return context().api;
        },
        get snapshot() {
            return context().snapshot;
        },
        get project() {
            return context().project;
        },
        get program() {
            const native = context();
            return native.program ?? native.project.program;
        },
        get checker() {
            return checker();
        },
        getTypeAtLocation(node) {
            return checker().getTypeAtLocation(nativeNode(node));
        },
        getSymbolAtLocation(node) {
            return checker().getSymbolAtLocation(nativeNode(node));
        },
    };
}

export class BatchLintRunner {
    readonly #configuration: LintConfiguration;
    readonly #plugins: NonNullable<Linter.Config["plugins"]>;
    readonly #prepared = new Map<PreparedConfiguration, Linter.Config[]>();
    #linter: Linter | undefined;
    #file: FileRuleState | undefined;

    constructor(configuration: LintConfiguration) {
        this.#configuration = configuration;
        this.#linter = new Linter({ cwd: configuration.currentDirectory });
        this.#plugins = isolateRules(configuration.plugins, () => {
            if (!this.#file) throw new Error("Native lint rule execution requires an active file");
            return this.#file;
        });
    }

    [Symbol.dispose](): void {
        // Linter retains its last SourceCode. Release the entire batch when work ends.
        this.#linter = undefined;
        this.#file = undefined;
        this.#prepared.clear();
    }

    async lintFile(fileName: string, native: SourceFile, nativeAPIContext?: NativeAPIContext | undefined): Promise<{ messages: LintMessage[]; timings: FileTimings; error?: string | undefined; }> {
        const linter = this.#linter;
        if (!linter) throw new Error("Native lint batch has been disposed");
        const configuration = this.#configuration;
        const started = performance.now();
        const text = native.text;
        const decoded = performance.now();
        const converted = convertSourceFile(native, true);
        const bomOffset = text.charCodeAt(0) === 0xFEFF ? 1 : 0;
        const convertedAt = performance.now();
        const options = configuration.compilerOptions;
        const format = nativeAPIContext && (nativeAPIContext.program ?? nativeAPIContext.project.program).getSourceFileMetadata(native.fileName)?.impliedNodeFormat;
        const sourceType = options?.sourceType ?? (format === ModuleKind.CommonJS ? "commonjs" : format === ModuleKind.ESNext ? "module" : converted.ast.sourceType);
        const scopeManager: unknown = analyzeScopes(converted.ast, {
            sourceType: sourceType === "commonjs" ? "script" : sourceType,
            globalReturn: sourceType === "commonjs",
            childVisitorKeys: converted.visitorKeys,
            lib: scopeLibraries(configuration, nativeAPIContext),
            impliedStrict: options?.alwaysStrict ?? options?.strict ?? true,
            jsxPragma: options?.jsx === 4 || options?.jsx === 5 ? null : "React",
            jsxFragmentName: null,
        });
        assertScopeManager(scopeManager);
        const scoped = performance.now();
        const ast: unknown = converted.ast;
        assertProgram(ast);
        if (!converted.ast.comments) throw new Error("Converted ESTree program is missing comments");
        const globals = converted.ast.comments.length === 0 ? emptyGlobals : globalComments(converted.ast.comments);
        const prepared = getPrepared(configuration, sourceType, Object.keys(globals).length === 0 ? emptyGlobals : globals, native.languageVariant === LanguageVariant.JSX);
        let configs = this.#prepared.get(prepared);
        if (!configs) {
            configs = prepared.configs.map(config => config.plugins ? { ...config, plugins: this.#plugins } : config);
            this.#prepared.set(prepared, configs);
        }
        const state: FileRuleState = { failures: new Map(), needsCodePaths: false };
        const failures = state.failures;
        const source = new NativeSourceCode(
            {
                text,
                ast,
                scopeManager,
                visitorKeys: eslintVisitorKeys(converted.visitorKeys),
                parserServices: parserServices(converted, nativeAPIContext),
            },
            converted.ast,
            () => state.needsCodePaths,
        );
        this.#file = state;
        try {
            const messages = linter.verify(source, configs, {
                filename: fileName,
                allowInlineConfig: false,
                reportUnusedDisableDirectives: false,
            });
            const verified = performance.now();
            const convertedMessages: LintMessage[] = [];
            for (const message of messages) {
                if (message.ruleId && failures.has(message.ruleId)) continue;
                try {
                    convertedMessages.push(...diagnostics([message], source, bomOffset));
                }
                catch (error) {
                    const id = message.ruleId ?? "ESLint";
                    failures.set(id, `Rule "${id}" failed: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
            return {
                messages: convertedMessages.filter(message => !failures.has(message.ruleId)),
                error: failures.size ? [...failures.values()].join("\n") : undefined,
                timings: { decode: decoded - started, conversion: convertedAt - decoded, scope: scoped - convertedAt, verify: verified - scoped },
            };
        }
        finally {
            this.#file = undefined;
        }
    }
}

export async function lintFile(configuration: LintConfiguration, fileName: string, native: SourceFile, nativeAPIContext?: NativeAPIContext | undefined): Promise<{ messages: LintMessage[]; timings: FileTimings; error?: string | undefined; }> {
    using runner = new BatchLintRunner(configuration);
    return await runner.lintFile(fileName, native, nativeAPIContext);
}
