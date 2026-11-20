import {
    isSourceFile,
    type SourceFile,
} from "../ast/index.ts";
import {
    loadConfiguration,
    loadPlugins,
    parsePluginSettings,
} from "./config.ts";
import {
    BatchLintRunner,
    prepareConfiguration,
} from "./runner.ts";
import type {
    BatchLintResult,
    InspectPluginsRequest,
    InspectPluginsResult,
    LintRequest,
    NativeAPIContext,
    WorkRequest,
    WorkResult,
} from "./types.ts";
import {
    record,
    string,
} from "./validation.ts";

export function executeWork(request: LintRequest, sourceFiles: readonly SourceFile[], nativeAPIContext?: NativeAPIContext | undefined, shouldCancel?: (() => boolean) | undefined): Promise<BatchLintResult>;
export function executeWork(request: InspectPluginsRequest, sourceFiles?: readonly SourceFile[] | undefined, nativeAPIContext?: NativeAPIContext | undefined, shouldCancel?: (() => boolean) | undefined): Promise<InspectPluginsResult>;
export function executeWork(request: WorkRequest, sourceFiles: readonly SourceFile[], nativeAPIContext?: NativeAPIContext | undefined, shouldCancel?: (() => boolean) | undefined): Promise<WorkResult>;
export async function executeWork(request: WorkRequest, sourceFiles: readonly SourceFile[] = [], nativeAPIContext?: NativeAPIContext | undefined, shouldCancel?: (() => boolean) | undefined): Promise<WorkResult> {
    function checkCancellation(): void {
        if (shouldCancel?.()) throw new Error("Lint work cancelled");
    }
    checkCancellation();
    const input = record(request, "Lint work");
    if (input.kind === "inspectPlugins") {
        const { ruleNames, watchedFiles } = await loadPlugins(parsePluginSettings(input));
        checkCancellation();
        return { ruleNames, watchedFiles };
    }
    if (input.kind !== "lint") throw new Error(`Unknown lint work kind "${String(input.kind)}"`);
    if (!Array.isArray(input.files) || input.files.length === 0 || input.files.length !== sourceFiles.length) {
        throw new Error("Lint file count must match the nonempty batch of supplied native source files");
    }
    const fileNames = input.files.map((file: unknown) => string(record(file, "Lint file").fileName, "fileName"));
    for (const sourceFile of sourceFiles) {
        if (!isSourceFile(sourceFile)) throw new Error("Lint work requires native SourceFile objects");
    }
    const options = input.compilerOptions === undefined && nativeAPIContext
        ? (nativeAPIContext.program ?? nativeAPIContext.project.program).getCompilerOptions()
        : input.compilerOptions;
    const configuration = await loadConfiguration({ ...input, compilerOptions: options });
    await prepareConfiguration(configuration);
    checkCancellation();
    using runner = new BatchLintRunner(configuration);
    const result: BatchLintResult = { files: [] };
    for (let index = 0; index < sourceFiles.length; index++) {
        checkCancellation();
        const fileName = fileNames[index];
        try {
            const linted = await runner.lintFile(fileName, sourceFiles[index], nativeAPIContext);
            result.files.push({ fileName, ...linted });
        }
        catch (error) {
            result.files.push({
                fileName,
                messages: [],
                timings: { decode: 0, conversion: 0, scope: 0, verify: 0 },
                error: `Linting "${fileName}" failed: ${error instanceof Error ? error.message : String(error)}`,
            });
        }
        checkCancellation();
    }
    return result;
}
