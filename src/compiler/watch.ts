/*@internal*/
namespace ts {
    const sysFormatDiagnosticsHost: ts.FormatDiagnosticsHost = ts.sys ? {
        getCurrentDirectory: () => ts.sys.getCurrentDirectory(),
        getNewLine: () => ts.sys.newLine,
        getCanonicalFileName: ts.createGetCanonicalFileName(ts.sys.useCaseSensitiveFileNames)
    } : undefined!; // TODO: GH#18217
    /**
     * Create a function that reports error by writing to the system and handles the formating of the diagnostic
     */
    export function createDiagnosticReporter(system: ts.System, pretty?: boolean): ts.DiagnosticReporter {
        const host: ts.FormatDiagnosticsHost = system === ts.sys ? sysFormatDiagnosticsHost : {
            getCurrentDirectory: () => system.getCurrentDirectory(),
            getNewLine: () => system.newLine,
            getCanonicalFileName: ts.createGetCanonicalFileName(system.useCaseSensitiveFileNames),
        };
        if (!pretty) {
            return diagnostic => system.write(ts.formatDiagnostic(diagnostic, host));
        }
        const diagnostics: ts.Diagnostic[] = new Array(1);
        return diagnostic => {
            diagnostics[0] = diagnostic;
            system.write(ts.formatDiagnosticsWithColorAndContext(diagnostics, host) + host.getNewLine());
            diagnostics[0] = undefined!; // TODO: GH#18217
        };
    }
    /**
     * @returns Whether the screen was cleared.
     */
    function clearScreenIfNotWatchingForFileChanges(system: ts.System, diagnostic: ts.Diagnostic, options: ts.CompilerOptions): boolean {
        if (system.clearScreen &&
            !options.preserveWatchOutput &&
            !options.extendedDiagnostics &&
            !options.diagnostics &&
            ts.contains(screenStartingMessageCodes, diagnostic.code)) {
            system.clearScreen();
            return true;
        }
        return false;
    }
    export const screenStartingMessageCodes: number[] = [
        ts.Diagnostics.Starting_compilation_in_watch_mode.code,
        ts.Diagnostics.File_change_detected_Starting_incremental_compilation.code,
    ];
    function getPlainDiagnosticFollowingNewLines(diagnostic: ts.Diagnostic, newLine: string): string {
        return ts.contains(screenStartingMessageCodes, diagnostic.code)
            ? newLine + newLine
            : newLine;
    }
    /**
     * Get locale specific time based on whether we are in test mode
     */
    export function getLocaleTimeString(system: ts.System) {
        return !system.now ?
            new Date().toLocaleTimeString() :
            system.now().toLocaleTimeString("en-US", { timeZone: "UTC" });
    }
    /**
     * Create a function that reports watch status by writing to the system and handles the formating of the diagnostic
     */
    export function createWatchStatusReporter(system: ts.System, pretty?: boolean): ts.WatchStatusReporter {
        return pretty ?
            (diagnostic, newLine, options) => {
                clearScreenIfNotWatchingForFileChanges(system, diagnostic, options);
                let output = `[${ts.formatColorAndReset(getLocaleTimeString(system), ts.ForegroundColorEscapeSequences.Grey)}] `;
                output += `${ts.flattenDiagnosticMessageText(diagnostic.messageText, system.newLine)}${newLine + newLine}`;
                system.write(output);
            } :
            (diagnostic, newLine, options) => {
                let output = "";
                if (!clearScreenIfNotWatchingForFileChanges(system, diagnostic, options)) {
                    output += newLine;
                }
                output += `${getLocaleTimeString(system)} - `;
                output += `${ts.flattenDiagnosticMessageText(diagnostic.messageText, system.newLine)}${getPlainDiagnosticFollowingNewLines(diagnostic, newLine)}`;
                system.write(output);
            };
    }
    /** Parses config file using System interface */
    export function parseConfigFileWithSystem(configFileName: string, optionsToExtend: ts.CompilerOptions, watchOptionsToExtend: ts.WatchOptions | undefined, system: ts.System, reportDiagnostic: ts.DiagnosticReporter) {
        const host: ts.ParseConfigFileHost = (<any>system);
        host.onUnRecoverableConfigFileDiagnostic = diagnostic => reportUnrecoverableDiagnostic(system, reportDiagnostic, diagnostic);
        const result = ts.getParsedCommandLineOfConfigFile(configFileName, optionsToExtend, host, /*extendedConfigCache*/ undefined, watchOptionsToExtend);
        host.onUnRecoverableConfigFileDiagnostic = undefined!; // TODO: GH#18217
        return result;
    }
    export function getErrorCountForSummary(diagnostics: readonly ts.Diagnostic[]) {
        return ts.countWhere(diagnostics, diagnostic => diagnostic.category === ts.DiagnosticCategory.Error);
    }
    export function getWatchErrorSummaryDiagnosticMessage(errorCount: number) {
        return errorCount === 1 ?
            ts.Diagnostics.Found_1_error_Watching_for_file_changes :
            ts.Diagnostics.Found_0_errors_Watching_for_file_changes;
    }
    export function getErrorSummaryText(errorCount: number, newLine: string) {
        if (errorCount === 0)
            return "";
        const d = ts.createCompilerDiagnostic(errorCount === 1 ? ts.Diagnostics.Found_1_error : ts.Diagnostics.Found_0_errors, errorCount);
        return `${newLine}${ts.flattenDiagnosticMessageText(d.messageText, newLine)}${newLine}${newLine}`;
    }
    /**
     * Program structure needed to emit the files and report diagnostics
     */
    export interface ProgramToEmitFilesAndReportErrors {
        getCurrentDirectory(): string;
        getCompilerOptions(): ts.CompilerOptions;
        getSourceFiles(): readonly ts.SourceFile[];
        getSyntacticDiagnostics(sourceFile?: ts.SourceFile, cancellationToken?: ts.CancellationToken): readonly ts.Diagnostic[];
        getOptionsDiagnostics(cancellationToken?: ts.CancellationToken): readonly ts.Diagnostic[];
        getGlobalDiagnostics(cancellationToken?: ts.CancellationToken): readonly ts.Diagnostic[];
        getSemanticDiagnostics(sourceFile?: ts.SourceFile, cancellationToken?: ts.CancellationToken): readonly ts.Diagnostic[];
        getDeclarationDiagnostics(sourceFile?: ts.SourceFile, cancellationToken?: ts.CancellationToken): readonly ts.DiagnosticWithLocation[];
        getConfigFileParsingDiagnostics(): readonly ts.Diagnostic[];
        emit(targetSourceFile?: ts.SourceFile, writeFile?: ts.WriteFileCallback, cancellationToken?: ts.CancellationToken, emitOnlyDtsFiles?: boolean, customTransformers?: ts.CustomTransformers): ts.EmitResult;
    }
    export function listFiles(program: ProgramToEmitFilesAndReportErrors, writeFileName: (s: string) => void) {
        if (program.getCompilerOptions().listFiles || program.getCompilerOptions().listFilesOnly) {
            ts.forEach(program.getSourceFiles(), file => {
                writeFileName(file.fileName);
            });
        }
    }
    /**
     * Helper that emit files, report diagnostics and lists emitted and/or source files depending on compiler options
     */
    export function emitFilesAndReportErrors(program: ProgramToEmitFilesAndReportErrors, reportDiagnostic: ts.DiagnosticReporter, writeFileName?: (s: string) => void, reportSummary?: ts.ReportEmitErrorSummary, writeFile?: ts.WriteFileCallback, cancellationToken?: ts.CancellationToken, emitOnlyDtsFiles?: boolean, customTransformers?: ts.CustomTransformers) {
        const isListFilesOnly = !!program.getCompilerOptions().listFilesOnly;
        // First get and report any syntactic errors.
        const allDiagnostics = program.getConfigFileParsingDiagnostics().slice();
        const configFileParsingDiagnosticsLength = allDiagnostics.length;
        ts.addRange(allDiagnostics, program.getSyntacticDiagnostics(/*sourceFile*/ undefined, cancellationToken));
        // If we didn't have any syntactic errors, then also try getting the global and
        // semantic errors.
        if (allDiagnostics.length === configFileParsingDiagnosticsLength) {
            ts.addRange(allDiagnostics, program.getOptionsDiagnostics(cancellationToken));
            if (!isListFilesOnly) {
                ts.addRange(allDiagnostics, program.getGlobalDiagnostics(cancellationToken));
                if (allDiagnostics.length === configFileParsingDiagnosticsLength) {
                    ts.addRange(allDiagnostics, program.getSemanticDiagnostics(/*sourceFile*/ undefined, cancellationToken));
                }
            }
        }
        // Emit and report any errors we ran into.
        const emitResult = isListFilesOnly
            ? { emitSkipped: true, diagnostics: ts.emptyArray }
            : program.emit(/*targetSourceFile*/ undefined, writeFile, cancellationToken, emitOnlyDtsFiles, customTransformers);
        const { emittedFiles, diagnostics: emitDiagnostics } = emitResult;
        ts.addRange(allDiagnostics, emitDiagnostics);
        const diagnostics = ts.sortAndDeduplicateDiagnostics(allDiagnostics);
        diagnostics.forEach(reportDiagnostic);
        if (writeFileName) {
            const currentDir = program.getCurrentDirectory();
            ts.forEach(emittedFiles, file => {
                const filepath = ts.getNormalizedAbsolutePath(file, currentDir);
                writeFileName(`TSFILE: ${filepath}`);
            });
            listFiles(program, writeFileName);
        }
        if (reportSummary) {
            reportSummary(getErrorCountForSummary(diagnostics));
        }
        return {
            emitResult,
            diagnostics,
        };
    }
    export function emitFilesAndReportErrorsAndGetExitStatus(program: ProgramToEmitFilesAndReportErrors, reportDiagnostic: ts.DiagnosticReporter, writeFileName?: (s: string) => void, reportSummary?: ts.ReportEmitErrorSummary, writeFile?: ts.WriteFileCallback, cancellationToken?: ts.CancellationToken, emitOnlyDtsFiles?: boolean, customTransformers?: ts.CustomTransformers) {
        const { emitResult, diagnostics } = emitFilesAndReportErrors(program, reportDiagnostic, writeFileName, reportSummary, writeFile, cancellationToken, emitOnlyDtsFiles, customTransformers);
        if (emitResult.emitSkipped && diagnostics.length > 0) {
            // If the emitter didn't emit anything, then pass that value along.
            return ts.ExitStatus.DiagnosticsPresent_OutputsSkipped;
        }
        else if (diagnostics.length > 0) {
            // The emitter emitted something, inform the caller if that happened in the presence
            // of diagnostics or not.
            return ts.ExitStatus.DiagnosticsPresent_OutputsGenerated;
        }
        return ts.ExitStatus.Success;
    }
    export const noopFileWatcher: ts.FileWatcher = { close: ts.noop };
    export function createWatchHost(system = ts.sys, reportWatchStatus?: ts.WatchStatusReporter): ts.WatchHost {
        const onWatchStatusChange = reportWatchStatus || createWatchStatusReporter(system);
        return {
            onWatchStatusChange,
            watchFile: ts.maybeBind(system, system.watchFile) || (() => noopFileWatcher),
            watchDirectory: ts.maybeBind(system, system.watchDirectory) || (() => noopFileWatcher),
            setTimeout: ts.maybeBind(system, system.setTimeout) || ts.noop,
            clearTimeout: ts.maybeBind(system, system.clearTimeout) || ts.noop
        };
    }
    export type WatchType = WatchTypeRegistry[keyof WatchTypeRegistry];
    export const WatchType: WatchTypeRegistry = {
        ConfigFile: "Config file",
        SourceFile: "Source file",
        MissingFile: "Missing file",
        WildcardDirectory: "Wild card directory",
        FailedLookupLocations: "Failed Lookup Locations",
        TypeRoots: "Type roots"
    };
    export interface WatchTypeRegistry {
        ConfigFile: "Config file";
        SourceFile: "Source file";
        MissingFile: "Missing file";
        WildcardDirectory: "Wild card directory";
        FailedLookupLocations: "Failed Lookup Locations";
        TypeRoots: "Type roots";
    }
    interface WatchFactory<X, Y = undefined> extends ts.WatchFactory<X, Y> {
        writeLog: (s: string) => void;
    }
    export function createWatchFactory<Y = undefined>(host: {
        trace?(s: string): void;
    }, options: {
        extendedDiagnostics?: boolean;
        diagnostics?: boolean;
    }) {
        const watchLogLevel = host.trace ? options.extendedDiagnostics ? ts.WatchLogLevel.Verbose : options.diagnostics ? ts.WatchLogLevel.TriggerOnly : ts.WatchLogLevel.None : ts.WatchLogLevel.None;
        const writeLog: (s: string) => void = watchLogLevel !== ts.WatchLogLevel.None ? (s => host.trace!(s)) : ts.noop;
        const result = (ts.getWatchFactory<WatchType, Y>(watchLogLevel, writeLog) as WatchFactory<WatchType, Y>);
        result.writeLog = writeLog;
        return result;
    }
    export function createCompilerHostFromProgramHost(host: ts.ProgramHost<any>, getCompilerOptions: () => ts.CompilerOptions, directoryStructureHost: ts.DirectoryStructureHost = host): ts.CompilerHost {
        const useCaseSensitiveFileNames = host.useCaseSensitiveFileNames();
        const hostGetNewLine = ts.memoize(() => host.getNewLine());
        return {
            getSourceFile: (fileName, languageVersion, onError) => {
                let text: string | undefined;
                try {
                    ts.performance.mark("beforeIORead");
                    text = host.readFile(fileName, getCompilerOptions().charset);
                    ts.performance.mark("afterIORead");
                    ts.performance.measure("I/O Read", "beforeIORead", "afterIORead");
                }
                catch (e) {
                    if (onError) {
                        onError(e.message);
                    }
                    text = "";
                }
                return text !== undefined ? ts.createSourceFile(fileName, text, languageVersion) : undefined;
            },
            getDefaultLibLocation: ts.maybeBind(host, host.getDefaultLibLocation),
            getDefaultLibFileName: options => host.getDefaultLibFileName(options),
            writeFile,
            getCurrentDirectory: ts.memoize(() => host.getCurrentDirectory()),
            useCaseSensitiveFileNames: () => useCaseSensitiveFileNames,
            getCanonicalFileName: ts.createGetCanonicalFileName(useCaseSensitiveFileNames),
            getNewLine: () => ts.getNewLineCharacter(getCompilerOptions(), hostGetNewLine),
            fileExists: f => host.fileExists(f),
            readFile: f => host.readFile(f),
            trace: ts.maybeBind(host, host.trace),
            directoryExists: ts.maybeBind(directoryStructureHost, directoryStructureHost.directoryExists),
            getDirectories: ts.maybeBind(directoryStructureHost, directoryStructureHost.getDirectories),
            realpath: ts.maybeBind(host, host.realpath),
            getEnvironmentVariable: ts.maybeBind(host, host.getEnvironmentVariable) || (() => ""),
            createHash: ts.maybeBind(host, host.createHash),
            readDirectory: ts.maybeBind(host, host.readDirectory),
        };
        function writeFile(fileName: string, text: string, writeByteOrderMark: boolean, onError: (message: string) => void) {
            try {
                ts.performance.mark("beforeIOWrite");
                // NOTE: If patchWriteFileEnsuringDirectory has been called,
                // the host.writeFile will do its own directory creation and
                // the ensureDirectoriesExist call will always be redundant.
                ts.writeFileEnsuringDirectories(fileName, text, writeByteOrderMark, (path, data, writeByteOrderMark) => host.writeFile!(path, data, writeByteOrderMark), path => host.createDirectory!(path), path => host.directoryExists!(path));
                ts.performance.mark("afterIOWrite");
                ts.performance.measure("I/O Write", "beforeIOWrite", "afterIOWrite");
            }
            catch (e) {
                if (onError) {
                    onError(e.message);
                }
            }
        }
    }
    export function setGetSourceFileAsHashVersioned(compilerHost: ts.CompilerHost, host: {
        createHash?(data: string): string;
    }) {
        const originalGetSourceFile = compilerHost.getSourceFile;
        const computeHash = host.createHash || ts.generateDjb2Hash;
        compilerHost.getSourceFile = (...args) => {
            const result = originalGetSourceFile.call(compilerHost, ...args);
            if (result) {
                result.version = computeHash.call(host, result.text);
            }
            return result;
        };
    }
    /**
     * Creates the watch compiler host that can be extended with config file or root file names and options host
     */
    export function createProgramHost<T extends ts.BuilderProgram = ts.EmitAndSemanticDiagnosticsBuilderProgram>(system: ts.System, createProgram: ts.CreateProgram<T> | undefined): ts.ProgramHost<T> {
        const getDefaultLibLocation = ts.memoize(() => ts.getDirectoryPath(ts.normalizePath(system.getExecutingFilePath())));
        let host: ts.DirectoryStructureHost = system;
        // TODO: `host` is unused!
        // eslint-disable-next-line no-unused-expressions
        host;
        return {
            useCaseSensitiveFileNames: () => system.useCaseSensitiveFileNames,
            getNewLine: () => system.newLine,
            getCurrentDirectory: ts.memoize(() => system.getCurrentDirectory()),
            getDefaultLibLocation,
            getDefaultLibFileName: options => ts.combinePaths(getDefaultLibLocation(), ts.getDefaultLibFileName(options)),
            fileExists: path => system.fileExists(path),
            readFile: (path, encoding) => system.readFile(path, encoding),
            directoryExists: path => system.directoryExists(path),
            getDirectories: path => system.getDirectories(path),
            readDirectory: (path, extensions, exclude, include, depth) => system.readDirectory(path, extensions, exclude, include, depth),
            realpath: ts.maybeBind(system, system.realpath),
            getEnvironmentVariable: ts.maybeBind(system, system.getEnvironmentVariable),
            trace: s => system.write(s + system.newLine),
            createDirectory: path => system.createDirectory(path),
            writeFile: (path, data, writeByteOrderMark) => system.writeFile(path, data, writeByteOrderMark),
            onCachedDirectoryStructureHostCreate: cacheHost => host = cacheHost || system,
            createHash: ts.maybeBind(system, system.createHash),
            createProgram: createProgram || (ts.createEmitAndSemanticDiagnosticsBuilderProgram as any as ts.CreateProgram<T>)
        };
    }
    /**
     * Creates the watch compiler host that can be extended with config file or root file names and options host
     */
    function createWatchCompilerHost<T extends ts.BuilderProgram = ts.EmitAndSemanticDiagnosticsBuilderProgram>(system = ts.sys, createProgram: ts.CreateProgram<T> | undefined, reportDiagnostic: ts.DiagnosticReporter, reportWatchStatus?: ts.WatchStatusReporter): ts.WatchCompilerHost<T> {
        const writeFileName = (s: string) => system.write(s + system.newLine);
        const result = (createProgramHost(system, createProgram) as ts.WatchCompilerHost<T>);
        ts.copyProperties(result, createWatchHost(system, reportWatchStatus));
        result.afterProgramCreate = builderProgram => {
            const compilerOptions = builderProgram.getCompilerOptions();
            const newLine = ts.getNewLineCharacter(compilerOptions, () => system.newLine);
            emitFilesAndReportErrors(builderProgram, reportDiagnostic, writeFileName, errorCount => result.onWatchStatusChange!(ts.createCompilerDiagnostic(getWatchErrorSummaryDiagnosticMessage(errorCount), errorCount), newLine, compilerOptions, errorCount));
        };
        return result;
    }
    /**
     * Report error and exit
     */
    function reportUnrecoverableDiagnostic(system: ts.System, reportDiagnostic: ts.DiagnosticReporter, diagnostic: ts.Diagnostic) {
        reportDiagnostic(diagnostic);
        system.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
    }
    /**
     * Creates the watch compiler host from system for config file in watch mode
     */
    export function createWatchCompilerHostOfConfigFile<T extends ts.BuilderProgram = ts.EmitAndSemanticDiagnosticsBuilderProgram>(configFileName: string, optionsToExtend: ts.CompilerOptions | undefined, watchOptionsToExtend: ts.WatchOptions | undefined, system: ts.System, createProgram?: ts.CreateProgram<T>, reportDiagnostic?: ts.DiagnosticReporter, reportWatchStatus?: ts.WatchStatusReporter): ts.WatchCompilerHostOfConfigFile<T> {
        const diagnosticReporter = reportDiagnostic || createDiagnosticReporter(system);
        const host = (createWatchCompilerHost(system, createProgram, diagnosticReporter, reportWatchStatus) as ts.WatchCompilerHostOfConfigFile<T>);
        host.onUnRecoverableConfigFileDiagnostic = diagnostic => reportUnrecoverableDiagnostic(system, diagnosticReporter, diagnostic);
        host.configFileName = configFileName;
        host.optionsToExtend = optionsToExtend;
        host.watchOptionsToExtend = watchOptionsToExtend;
        return host;
    }
    /**
     * Creates the watch compiler host from system for compiling root files and options in watch mode
     */
    export function createWatchCompilerHostOfFilesAndCompilerOptions<T extends ts.BuilderProgram = ts.EmitAndSemanticDiagnosticsBuilderProgram>(rootFiles: string[], options: ts.CompilerOptions, watchOptions: ts.WatchOptions | undefined, system: ts.System, createProgram?: ts.CreateProgram<T>, reportDiagnostic?: ts.DiagnosticReporter, reportWatchStatus?: ts.WatchStatusReporter, projectReferences?: readonly ts.ProjectReference[]): ts.WatchCompilerHostOfFilesAndCompilerOptions<T> {
        const host = (createWatchCompilerHost(system, createProgram, reportDiagnostic || createDiagnosticReporter(system), reportWatchStatus) as ts.WatchCompilerHostOfFilesAndCompilerOptions<T>);
        host.rootFiles = rootFiles;
        host.options = options;
        host.watchOptions = watchOptions;
        host.projectReferences = projectReferences;
        return host;
    }
    export interface IncrementalCompilationOptions {
        rootNames: readonly string[];
        options: ts.CompilerOptions;
        configFileParsingDiagnostics?: readonly ts.Diagnostic[];
        projectReferences?: readonly ts.ProjectReference[];
        host?: ts.CompilerHost;
        reportDiagnostic?: ts.DiagnosticReporter;
        reportErrorSummary?: ts.ReportEmitErrorSummary;
        afterProgramEmitAndDiagnostics?(program: ts.EmitAndSemanticDiagnosticsBuilderProgram): void;
        system?: ts.System;
    }
    export function performIncrementalCompilation(input: IncrementalCompilationOptions) {
        const system = input.system || ts.sys;
        const host = input.host || (input.host = ts.createIncrementalCompilerHost(input.options, system));
        const builderProgram = ts.createIncrementalProgram(input);
        const exitStatus = emitFilesAndReportErrorsAndGetExitStatus(builderProgram, input.reportDiagnostic || createDiagnosticReporter(system), s => host.trace && host.trace(s), input.reportErrorSummary || input.options.pretty ? errorCount => system.write(getErrorSummaryText(errorCount, system.newLine)) : undefined);
        if (input.afterProgramEmitAndDiagnostics)
            input.afterProgramEmitAndDiagnostics(builderProgram);
        return exitStatus;
    }
}
