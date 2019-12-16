namespace ts.tscWatch {
    export const projects = `/user/username/projects`;
    export const projectRoot = `${projects}/myproject`;
    export import WatchedSystem = ts.TestFSWithWatch.TestServerHost;
    export type File = ts.TestFSWithWatch.File;
    export type SymLink = ts.TestFSWithWatch.SymLink;
    export import libFile = ts.TestFSWithWatch.libFile;
    export import createWatchedSystem = ts.TestFSWithWatch.createWatchedSystem;
    export import checkArray = ts.TestFSWithWatch.checkArray;
    export import checkWatchedFiles = ts.TestFSWithWatch.checkWatchedFiles;
    export import checkWatchedFilesDetailed = ts.TestFSWithWatch.checkWatchedFilesDetailed;
    export import checkWatchedDirectories = ts.TestFSWithWatch.checkWatchedDirectories;
    export import checkWatchedDirectoriesDetailed = ts.TestFSWithWatch.checkWatchedDirectoriesDetailed;
    export import checkOutputContains = ts.TestFSWithWatch.checkOutputContains;
    export import checkOutputDoesNotContain = ts.TestFSWithWatch.checkOutputDoesNotContain;
    export const commonFile1: File = {
        path: "/a/b/commonFile1.ts",
        content: "let x = 1"
    };
    export const commonFile2: File = {
        path: "/a/b/commonFile2.ts",
        content: "let y = 1"
    };
    export function checkProgramActualFiles(program: ts.Program, expectedFiles: readonly string[]) {
        checkArray(`Program actual files`, program.getSourceFiles().map(file => file.fileName), expectedFiles);
    }
    export function checkProgramRootFiles(program: ts.Program, expectedFiles: readonly string[]) {
        checkArray(`Program rootFileNames`, program.getRootFileNames(), expectedFiles);
    }
    export interface Watch {
        (): ts.Program;
        getBuilderProgram(): ts.EmitAndSemanticDiagnosticsBuilderProgram;
        close(): void;
    }
    export function createWatchOfConfigFile(configFileName: string, host: WatchedSystem, optionsToExtend?: ts.CompilerOptions, watchOptionsToExtend?: ts.WatchOptions, maxNumberOfFilesToIterateForInvalidation?: number) {
        const compilerHost = ts.createWatchCompilerHostOfConfigFile(configFileName, optionsToExtend || {}, watchOptionsToExtend, host);
        compilerHost.maxNumberOfFilesToIterateForInvalidation = maxNumberOfFilesToIterateForInvalidation;
        const watch = ts.createWatchProgram(compilerHost);
        const result = (() => watch.getCurrentProgram().getProgram()) as Watch;
        result.getBuilderProgram = () => watch.getCurrentProgram();
        result.close = () => watch.close();
        return result;
    }
    export function createWatchOfFilesAndCompilerOptions(rootFiles: string[], host: WatchedSystem, options: ts.CompilerOptions = {}, watchOptions?: ts.WatchOptions, maxNumberOfFilesToIterateForInvalidation?: number) {
        const compilerHost = ts.createWatchCompilerHostOfFilesAndCompilerOptions(rootFiles, options, watchOptions, host);
        compilerHost.maxNumberOfFilesToIterateForInvalidation = maxNumberOfFilesToIterateForInvalidation;
        const watch = ts.createWatchProgram(compilerHost);
        return () => watch.getCurrentProgram().getProgram();
    }
    const elapsedRegex = /^Elapsed:: [0-9]+ms/;
    const buildVerboseLogRegEx = /^.+ \- /;
    export enum HostOutputKind {
        Log,
        Diagnostic,
        WatchDiagnostic
    }
    export interface HostOutputLog {
        kind: HostOutputKind.Log;
        expected: string;
        caption?: string;
    }
    export interface HostOutputDiagnostic {
        kind: HostOutputKind.Diagnostic;
        diagnostic: ts.Diagnostic | string;
    }
    export interface HostOutputWatchDiagnostic {
        kind: HostOutputKind.WatchDiagnostic;
        diagnostic: ts.Diagnostic | string;
    }
    export type HostOutput = HostOutputLog | HostOutputDiagnostic | HostOutputWatchDiagnostic;
    export function checkOutputErrors(host: WatchedSystem, expected: readonly HostOutput[], disableConsoleClears?: boolean | undefined) {
        let screenClears = 0;
        const outputs = host.getOutput();
        assert.equal(outputs.length, expected.length, JSON.stringify(outputs));
        let index = 0;
        ts.forEach(expected, expected => {
            switch (expected.kind) {
                case HostOutputKind.Log:
                    return assertLog(expected);
                case HostOutputKind.Diagnostic:
                    return assertDiagnostic(expected);
                case HostOutputKind.WatchDiagnostic:
                    return assertWatchDiagnostic(expected);
                default:
                    return ts.Debug.assertNever(expected);
            }
        });
        assert.equal(host.screenClears.length, screenClears, "Expected number of screen clears");
        host.clearOutput();
        function isDiagnostic(diagnostic: ts.Diagnostic | string): diagnostic is ts.Diagnostic {
            return !!(diagnostic as ts.Diagnostic).messageText;
        }
        function assertDiagnostic({ diagnostic }: HostOutputDiagnostic) {
            const expected = isDiagnostic(diagnostic) ? ts.formatDiagnostic(diagnostic, host) : diagnostic;
            assert.equal(outputs[index], expected, getOutputAtFailedMessage("Diagnostic", expected));
            index++;
        }
        function getCleanLogString(log: string) {
            return log.replace(elapsedRegex, "").replace(buildVerboseLogRegEx, "");
        }
        function assertLog({ caption, expected }: HostOutputLog) {
            const actual = outputs[index];
            assert.equal(getCleanLogString(actual), getCleanLogString(expected), getOutputAtFailedMessage(caption || "Log", expected));
            index++;
        }
        function assertWatchDiagnostic({ diagnostic }: HostOutputWatchDiagnostic) {
            if (ts.isString(diagnostic)) {
                assert.equal(outputs[index], diagnostic, getOutputAtFailedMessage("Diagnostic", diagnostic));
            }
            else {
                const expected = getWatchDiagnosticWithoutDate(diagnostic);
                if (!disableConsoleClears && ts.contains(ts.screenStartingMessageCodes, diagnostic.code)) {
                    assert.equal(host.screenClears[screenClears], index, `Expected screen clear at this diagnostic: ${expected}`);
                    screenClears++;
                }
                assert.isTrue(ts.endsWith(outputs[index], expected), getOutputAtFailedMessage("Watch diagnostic", expected));
            }
            index++;
        }
        function getOutputAtFailedMessage(caption: string, expectedOutput: string) {
            return `Expected ${caption}: ${JSON.stringify(expectedOutput)} at ${index} in ${JSON.stringify(outputs)}`;
        }
        function getWatchDiagnosticWithoutDate(diagnostic: ts.Diagnostic) {
            const newLines = ts.contains(ts.screenStartingMessageCodes, diagnostic.code)
                ? `${host.newLine}${host.newLine}`
                : host.newLine;
            return ` - ${ts.flattenDiagnosticMessageText(diagnostic.messageText, host.newLine)}${newLines}`;
        }
    }
    export function hostOutputLog(expected: string, caption?: string): HostOutputLog {
        return { kind: HostOutputKind.Log, expected, caption };
    }
    export function hostOutputDiagnostic(diagnostic: ts.Diagnostic | string): HostOutputDiagnostic {
        return { kind: HostOutputKind.Diagnostic, diagnostic };
    }
    export function hostOutputWatchDiagnostic(diagnostic: ts.Diagnostic | string): HostOutputWatchDiagnostic {
        return { kind: HostOutputKind.WatchDiagnostic, diagnostic };
    }
    export function startingCompilationInWatchMode() {
        return hostOutputWatchDiagnostic(ts.createCompilerDiagnostic(ts.Diagnostics.Starting_compilation_in_watch_mode));
    }
    export function foundErrorsWatching(errors: readonly any[]) {
        return hostOutputWatchDiagnostic(errors.length === 1 ?
            ts.createCompilerDiagnostic(ts.Diagnostics.Found_1_error_Watching_for_file_changes) :
            ts.createCompilerDiagnostic(ts.Diagnostics.Found_0_errors_Watching_for_file_changes, errors.length));
    }
    export function fileChangeDetected() {
        return hostOutputWatchDiagnostic(ts.createCompilerDiagnostic(ts.Diagnostics.File_change_detected_Starting_incremental_compilation));
    }
    export function checkOutputErrorsInitial(host: WatchedSystem, errors: readonly ts.Diagnostic[] | readonly string[], disableConsoleClears?: boolean, logsBeforeErrors?: string[]) {
        checkOutputErrors(host, [
            startingCompilationInWatchMode(),
            ...ts.map(logsBeforeErrors || ts.emptyArray, expected => hostOutputLog(expected, "logBeforeError")),
            ...ts.map(errors, hostOutputDiagnostic),
            foundErrorsWatching(errors)
        ], disableConsoleClears);
    }
    export function checkOutputErrorsIncremental(host: WatchedSystem, errors: readonly ts.Diagnostic[] | readonly string[], disableConsoleClears?: boolean, logsBeforeWatchDiagnostic?: string[], logsBeforeErrors?: string[]) {
        checkOutputErrors(host, [
            ...ts.map(logsBeforeWatchDiagnostic || ts.emptyArray, expected => hostOutputLog(expected, "logsBeforeWatchDiagnostic")),
            fileChangeDetected(),
            ...ts.map(logsBeforeErrors || ts.emptyArray, expected => hostOutputLog(expected, "logBeforeError")),
            ...ts.map(errors, hostOutputDiagnostic),
            foundErrorsWatching(errors)
        ], disableConsoleClears);
    }
    export function checkOutputErrorsIncrementalWithExit(host: WatchedSystem, errors: readonly ts.Diagnostic[] | readonly string[], expectedExitCode: ts.ExitStatus, disableConsoleClears?: boolean, logsBeforeWatchDiagnostic?: string[], logsBeforeErrors?: string[]) {
        checkOutputErrors(host, [
            ...ts.map(logsBeforeWatchDiagnostic || ts.emptyArray, expected => hostOutputLog(expected, "logsBeforeWatchDiagnostic")),
            fileChangeDetected(),
            ...ts.map(logsBeforeErrors || ts.emptyArray, expected => hostOutputLog(expected, "logBeforeError")),
            ...ts.map(errors, hostOutputDiagnostic),
        ], disableConsoleClears);
        assert.equal(host.exitCode, expectedExitCode);
    }
    export function checkNormalBuildErrors(host: WatchedSystem, errors: readonly ts.Diagnostic[] | readonly string[], reportErrorSummary?: boolean) {
        checkOutputErrors(host, [
            ...ts.map(errors, hostOutputDiagnostic),
            ...reportErrorSummary ?
                [hostOutputWatchDiagnostic(ts.getErrorSummaryText(errors.length, host.newLine))] : ts.emptyArray
        ]);
    }
    function isDiagnosticMessageChain(message: ts.DiagnosticMessage | ts.DiagnosticMessageChain): message is ts.DiagnosticMessageChain {
        return !!(message as ts.DiagnosticMessageChain).messageText;
    }
    export function getDiagnosticOfFileFrom(file: ts.SourceFile | undefined, start: number | undefined, length: number | undefined, message: ts.DiagnosticMessage | ts.DiagnosticMessageChain, ..._args: (string | number)[]): ts.Diagnostic {
        let text: ts.DiagnosticMessageChain | string;
        if (isDiagnosticMessageChain(message)) {
            text = message;
        }
        else {
            text = ts.getLocaleSpecificMessage(message);
            if (arguments.length > 4) {
                text = ts.formatStringFromArgs(text, arguments, 4);
            }
        }
        return {
            file,
            start,
            length,
            messageText: text,
            category: message.category,
            code: message.code,
        };
    }
    export function getDiagnosticWithoutFile(message: ts.DiagnosticMessage | ts.DiagnosticMessageChain, ...args: (string | number)[]): ts.Diagnostic {
        return getDiagnosticOfFileFrom(/*file*/ undefined, /*start*/ undefined, /*length*/ undefined, message, ...args);
    }
    export function getDiagnosticOfFile(file: ts.SourceFile, start: number, length: number, message: ts.DiagnosticMessage | ts.DiagnosticMessageChain, ...args: (string | number)[]): ts.Diagnostic {
        return getDiagnosticOfFileFrom(file, start, length, message, ...args);
    }
    export function getDiagnosticOfFileFromProgram(program: ts.Program, filePath: string, start: number, length: number, message: ts.DiagnosticMessage | ts.DiagnosticMessageChain, ...args: (string | number)[]): ts.Diagnostic {
        return getDiagnosticOfFileFrom(program.getSourceFileByPath(ts.toPath(filePath, program.getCurrentDirectory(), s => s.toLowerCase())), start, length, message, ...args);
    }
    export function getUnknownCompilerOption(program: ts.Program, configFile: File, option: string) {
        const quotedOption = `"${option}"`;
        return getDiagnosticOfFile((program.getCompilerOptions().configFile!), configFile.content.indexOf(quotedOption), quotedOption.length, ts.Diagnostics.Unknown_compiler_option_0, option);
    }
    export function getUnknownDidYouMeanCompilerOption(program: ts.Program, configFile: File, option: string, didYouMean: string) {
        const quotedOption = `"${option}"`;
        return getDiagnosticOfFile((program.getCompilerOptions().configFile!), configFile.content.indexOf(quotedOption), quotedOption.length, ts.Diagnostics.Unknown_compiler_option_0_Did_you_mean_1, option, didYouMean);
    }
    export function getDiagnosticModuleNotFoundOfFile(program: ts.Program, file: File, moduleName: string) {
        const quotedModuleName = `"${moduleName}"`;
        return getDiagnosticOfFileFromProgram(program, file.path, file.content.indexOf(quotedModuleName), quotedModuleName.length, ts.Diagnostics.Cannot_find_module_0, moduleName);
    }
}
