import * as ts from "../../ts";
describe("unittests:: tsc-watch:: console clearing", () => {
    const currentDirectoryLog = "Current directory: / CaseSensitiveFileNames: false\n";
    const fileWatcherAddedLog = [
        "FileWatcher:: Added:: WatchInfo: /f.ts 250 undefined Source file\n",
        "FileWatcher:: Added:: WatchInfo: /a/lib/lib.d.ts 250 undefined Source file\n"
    ];
    const file: ts.tscWatch.File = {
        path: "/f.ts",
        content: ""
    };
    function getProgramSynchronizingLog(options: ts.CompilerOptions) {
        return [
            "Synchronizing program\n",
            "CreatingProgramWith::\n",
            "  roots: [\"/f.ts\"]\n",
            `  options: ${JSON.stringify(options)}\n`
        ];
    }
    function isConsoleClearDisabled(options: ts.CompilerOptions) {
        return options.diagnostics || options.extendedDiagnostics || options.preserveWatchOutput;
    }
    function verifyCompilation(host: ts.tscWatch.WatchedSystem, options: ts.CompilerOptions, initialDisableOptions?: ts.CompilerOptions) {
        const disableConsoleClear = isConsoleClearDisabled(options);
        const hasLog = options.extendedDiagnostics || options.diagnostics;
        ts.tscWatch.checkOutputErrorsInitial(host, ts.emptyArray, initialDisableOptions ? isConsoleClearDisabled(initialDisableOptions) : disableConsoleClear, hasLog ? [
            currentDirectoryLog,
            ...getProgramSynchronizingLog(options),
            ...(options.extendedDiagnostics ? fileWatcherAddedLog : ts.emptyArray)
        ] : undefined);
        host.modifyFile(file.path, "//");
        host.runQueuedTimeoutCallbacks();
        ts.tscWatch.checkOutputErrorsIncremental(host, ts.emptyArray, disableConsoleClear, hasLog ? [
            "FileWatcher:: Triggered with /f.ts 1:: WatchInfo: /f.ts 250 undefined Source file\n",
            "Scheduling update\n",
            "Elapsed:: 0ms FileWatcher:: Triggered with /f.ts 1:: WatchInfo: /f.ts 250 undefined Source file\n"
        ] : undefined, hasLog ? getProgramSynchronizingLog(options) : undefined);
    }
    function checkConsoleClearingUsingCommandLineOptions(options: ts.CompilerOptions = {}) {
        const files = [file, ts.tscWatch.libFile];
        const host = ts.tscWatch.createWatchedSystem(files);
        ts.tscWatch.createWatchOfFilesAndCompilerOptions([file.path], host, options);
        verifyCompilation(host, options);
    }
    it("without --diagnostics or --extendedDiagnostics", () => {
        checkConsoleClearingUsingCommandLineOptions();
    });
    it("with --diagnostics", () => {
        checkConsoleClearingUsingCommandLineOptions({
            diagnostics: true,
        });
    });
    it("with --extendedDiagnostics", () => {
        checkConsoleClearingUsingCommandLineOptions({
            extendedDiagnostics: true,
        });
    });
    it("with --preserveWatchOutput", () => {
        checkConsoleClearingUsingCommandLineOptions({
            preserveWatchOutput: true,
        });
    });
    describe("when preserveWatchOutput is true in config file", () => {
        const compilerOptions: ts.CompilerOptions = {
            preserveWatchOutput: true
        };
        const configFile: ts.tscWatch.File = {
            path: "/tsconfig.json",
            content: JSON.stringify({ compilerOptions })
        };
        const files = [file, configFile, ts.tscWatch.libFile];
        it("using createWatchOfConfigFile ", () => {
            const host = ts.tscWatch.createWatchedSystem(files);
            ts.tscWatch.createWatchOfConfigFile(configFile.path, host);
            // Initially console is cleared if --preserveOutput is not provided since the config file is yet to be parsed
            verifyCompilation(host, compilerOptions, {});
        });
        it("when createWatchProgram is invoked with configFileParseResult on WatchCompilerHostOfConfigFile", () => {
            const host = ts.tscWatch.createWatchedSystem(files);
            const reportDiagnostic = ts.createDiagnosticReporter(host);
            const optionsToExtend: ts.CompilerOptions = {};
            const configParseResult = (ts.parseConfigFileWithSystem(configFile.path, optionsToExtend, /*watchOptionsToExtend*/ undefined, host, reportDiagnostic)!);
            const watchCompilerHost = ts.createWatchCompilerHostOfConfigFile((configParseResult.options.configFilePath!), optionsToExtend, /*watchOptionsToExtend*/ undefined, host, /*createProgram*/ undefined, reportDiagnostic, ts.createWatchStatusReporter(host));
            watchCompilerHost.configFileParsingResult = configParseResult;
            ts.createWatchProgram(watchCompilerHost);
            verifyCompilation(host, compilerOptions);
        });
    });
});
