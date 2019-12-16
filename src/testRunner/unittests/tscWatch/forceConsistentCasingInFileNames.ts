namespace ts.tscWatch {
    describe("unittests:: tsc-watch:: forceConsistentCasingInFileNames", () => {
        function createWatch() {
            const loggerFile: ts.tscWatch.File = {
                path: `${ts.tscWatch.projectRoot}/logger.ts`,
                content: `export class logger { }`
            };
            const anotherFile: ts.tscWatch.File = {
                path: `${ts.tscWatch.projectRoot}/another.ts`,
                content: `import { logger } from "./logger"; new logger();`
            };
            const tsconfig: ts.tscWatch.File = {
                path: `${ts.tscWatch.projectRoot}/tsconfig.json`,
                content: JSON.stringify({
                    compilerOptions: { forceConsistentCasingInFileNames: true }
                })
            };
            const host = ts.tscWatch.createWatchedSystem([loggerFile, anotherFile, tsconfig, ts.tscWatch.libFile, tsconfig]);
            const watch = ts.tscWatch.createWatchOfConfigFile(tsconfig.path, host);
            ts.tscWatch.checkProgramActualFiles(watch(), [loggerFile.path, anotherFile.path, ts.tscWatch.libFile.path]);
            ts.tscWatch.checkOutputErrorsInitial(host, ts.emptyArray);
            return { host, watch, anotherFile, loggerFile };
        }
        it("when changing module name with different casing", () => {
            const { host, watch, anotherFile, loggerFile } = createWatch();
            host.writeFile(anotherFile.path, anotherFile.content.replace("./logger", "./Logger"));
            host.runQueuedTimeoutCallbacks();
            ts.tscWatch.checkProgramActualFiles(watch(), [`${ts.tscWatch.projectRoot}/Logger.ts`, anotherFile.path, ts.tscWatch.libFile.path]);
            ts.tscWatch.checkOutputErrorsIncremental(host, [
                ts.tscWatch.getDiagnosticOfFileFromProgram(watch(), anotherFile.path, anotherFile.content.indexOf(`"./logger"`), `"./logger"`.length, ts.Diagnostics.Already_included_file_name_0_differs_from_file_name_1_only_in_casing, `${ts.tscWatch.projectRoot}/Logger.ts`, loggerFile.path),
            ]);
        });
        it("when renaming file with different casing", () => {
            const { host, watch, anotherFile, loggerFile } = createWatch();
            host.renameFile(loggerFile.path, `${ts.tscWatch.projectRoot}/Logger.ts`);
            host.runQueuedTimeoutCallbacks();
            ts.tscWatch.checkProgramActualFiles(watch(), [`${ts.tscWatch.projectRoot}/Logger.ts`, anotherFile.path, ts.tscWatch.libFile.path]);
            ts.tscWatch.checkOutputErrorsIncremental(host, [
                ts.tscWatch.getDiagnosticOfFileFromProgram(watch(), anotherFile.path, anotherFile.content.indexOf(`"./logger"`), `"./logger"`.length, ts.Diagnostics.File_name_0_differs_from_already_included_file_name_1_only_in_casing, loggerFile.path, `${ts.tscWatch.projectRoot}/Logger.ts`),
            ]);
        });
    });
}
