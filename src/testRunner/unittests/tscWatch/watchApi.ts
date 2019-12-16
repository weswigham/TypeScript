namespace ts.tscWatch {
    describe("unittests:: tsc-watch:: watchAPI:: tsc-watch with custom module resolution", () => {
        const configFileJson: any = {
            compilerOptions: { module: "commonjs", resolveJsonModule: true },
            files: ["index.ts"]
        };
        const mainFile: ts.tscWatch.File = {
            path: `${ts.tscWatch.projectRoot}/index.ts`,
            content: "import settings from './settings.json';"
        };
        const config: ts.tscWatch.File = {
            path: `${ts.tscWatch.projectRoot}/tsconfig.json`,
            content: JSON.stringify(configFileJson)
        };
        const settingsJson: ts.tscWatch.File = {
            path: `${ts.tscWatch.projectRoot}/settings.json`,
            content: JSON.stringify({ content: "Print this" })
        };
        it("verify that module resolution with json extension works when returned without extension", () => {
            const files = [ts.tscWatch.libFile, mainFile, config, settingsJson];
            const host = ts.tscWatch.createWatchedSystem(files, { currentDirectory: ts.tscWatch.projectRoot });
            const compilerHost = ts.createWatchCompilerHostOfConfigFile(config.path, {}, /*watchOptionsToExtend*/ undefined, host);
            const parsedCommandResult = ts.parseJsonConfigFileContent(configFileJson, host, config.path);
            compilerHost.resolveModuleNames = (moduleNames, containingFile) => moduleNames.map(m => {
                const result = ts.resolveModuleName(m, containingFile, parsedCommandResult.options, compilerHost);
                const resolvedModule = result.resolvedModule!;
                return {
                    resolvedFileName: resolvedModule.resolvedFileName,
                    isExternalLibraryImport: resolvedModule.isExternalLibraryImport,
                    originalFileName: resolvedModule.originalPath,
                };
            });
            const watch = ts.createWatchProgram(compilerHost);
            const program = watch.getCurrentProgram().getProgram();
            ts.tscWatch.checkProgramActualFiles(program, [mainFile.path, ts.tscWatch.libFile.path, settingsJson.path]);
        });
    });
    describe("unittests:: tsc-watch:: watchAPI:: tsc-watch expose error count to watch status reporter", () => {
        const configFileJson: any = {
            compilerOptions: { module: "commonjs" },
            files: ["index.ts"]
        };
        const config: ts.tscWatch.File = {
            path: `${ts.tscWatch.projectRoot}/tsconfig.json`,
            content: JSON.stringify(configFileJson)
        };
        const mainFile: ts.tscWatch.File = {
            path: `${ts.tscWatch.projectRoot}/index.ts`,
            content: "let compiler = new Compiler(); for (let i = 0; j < 5; i++) {}"
        };
        it("verify that the error count is correctly passed down to the watch status reporter", () => {
            const files = [ts.tscWatch.libFile, mainFile, config];
            const host = ts.tscWatch.createWatchedSystem(files, { currentDirectory: ts.tscWatch.projectRoot });
            let watchedErrorCount;
            const reportWatchStatus: ts.WatchStatusReporter = (_, __, ___, errorCount) => {
                watchedErrorCount = errorCount;
            };
            const compilerHost = ts.createWatchCompilerHostOfConfigFile(config.path, {}, /*watchOptionsToExtend*/ undefined, host, /*createProgram*/ undefined, /*reportDiagnostic*/ undefined, reportWatchStatus);
            ts.createWatchProgram(compilerHost);
            assert.equal(watchedErrorCount, 2, "The error count was expected to be 2 for the file change");
        });
    });
}
