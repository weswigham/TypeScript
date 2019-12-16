import * as ts from "../../ts";
import Tsc_WatchDirectory = ts.TestFSWithWatch.Tsc_WatchDirectory;
describe("unittests:: tsc-watch:: watchEnvironment:: tsc-watch with different polling/non polling options", () => {
    it("watchFile using dynamic priority polling", () => {
        const projectFolder = "/a/username/project";
        const file1: ts.tscWatch.File = {
            path: `${projectFolder}/typescript.ts`,
            content: "var z = 10;"
        };
        const files = [file1, ts.tscWatch.libFile];
        const environmentVariables = ts.createMap<string>();
        environmentVariables.set("TSC_WATCHFILE", ts.TestFSWithWatch.Tsc_WatchFile.DynamicPolling);
        const host = ts.tscWatch.createWatchedSystem(files, { environmentVariables });
        const watch = ts.tscWatch.createWatchOfFilesAndCompilerOptions([file1.path], host);
        const initialProgram = watch();
        verifyProgram();
        const mediumPollingIntervalThreshold = ts.unchangedPollThresholds[ts.PollingInterval.Medium];
        for (let index = 0; index < mediumPollingIntervalThreshold; index++) {
            // Transition libFile and file1 to low priority queue
            host.checkTimeoutQueueLengthAndRun(1);
            assert.deepEqual(watch(), initialProgram);
        }
        // Make a change to file
        file1.content = "var zz30 = 100;";
        host.reloadFS(files);
        // This should detect change in the file
        host.checkTimeoutQueueLengthAndRun(1);
        assert.deepEqual(watch(), initialProgram);
        // Callbacks: medium priority + high priority queue and scheduled program update
        host.checkTimeoutQueueLengthAndRun(3);
        // During this timeout the file would be detected as unchanged
        let fileUnchangeDetected = 1;
        const newProgram = watch();
        assert.notStrictEqual(newProgram, initialProgram);
        verifyProgram();
        const outputFile1 = ts.changeExtension(file1.path, ".js");
        assert.isTrue(host.fileExists(outputFile1));
        assert.equal(host.readFile(outputFile1), file1.content + host.newLine);
        const newThreshold = ts.unchangedPollThresholds[ts.PollingInterval.Low] + mediumPollingIntervalThreshold;
        for (; fileUnchangeDetected < newThreshold; fileUnchangeDetected++) {
            // For high + Medium/low polling interval
            host.checkTimeoutQueueLengthAndRun(2);
            assert.deepEqual(watch(), newProgram);
        }
        // Everything goes in high polling interval queue
        host.checkTimeoutQueueLengthAndRun(1);
        assert.deepEqual(watch(), newProgram);
        function verifyProgram() {
            ts.tscWatch.checkProgramActualFiles(watch(), files.map(f => f.path));
            ts.tscWatch.checkWatchedFiles(host, []);
            ts.tscWatch.checkWatchedDirectories(host, [], /*recursive*/ false);
            ts.tscWatch.checkWatchedDirectories(host, [], /*recursive*/ true);
        }
    });
    describe("tsc-watch when watchDirectories implementation", () => {
        function verifyRenamingFileInSubFolder(tscWatchDirectory: Tsc_WatchDirectory) {
            const projectFolder = "/a/username/project";
            const projectSrcFolder = `${projectFolder}/src`;
            const configFile: ts.tscWatch.File = {
                path: `${projectFolder}/tsconfig.json`,
                content: JSON.stringify({
                    watchOptions: {
                        synchronousWatchDirectory: true
                    }
                })
            };
            const file: ts.tscWatch.File = {
                path: `${projectSrcFolder}/file1.ts`,
                content: ""
            };
            const programFiles = [file, ts.tscWatch.libFile];
            const files = [file, configFile, ts.tscWatch.libFile];
            const environmentVariables = ts.createMap<string>();
            environmentVariables.set("TSC_WATCHDIRECTORY", tscWatchDirectory);
            const host = ts.tscWatch.createWatchedSystem(files, { environmentVariables });
            const watch = ts.tscWatch.createWatchOfConfigFile(configFile.path, host);
            const projectFolders = [projectFolder, projectSrcFolder, `${projectFolder}/node_modules/@types`];
            // Watching files config file, file, lib file
            const expectedWatchedFiles = files.map(f => f.path);
            const expectedWatchedDirectories = tscWatchDirectory === Tsc_WatchDirectory.NonRecursiveWatchDirectory ? projectFolders : ts.emptyArray;
            if (tscWatchDirectory === Tsc_WatchDirectory.WatchFile) {
                expectedWatchedFiles.push(...projectFolders);
            }
            verifyProgram(ts.tscWatch.checkOutputErrorsInitial);
            // Rename the file:
            file.path = file.path.replace("file1.ts", "file2.ts");
            expectedWatchedFiles[0] = file.path;
            host.reloadFS(files);
            if (tscWatchDirectory === Tsc_WatchDirectory.DynamicPolling) {
                // With dynamic polling the fs change would be detected only by running timeouts
                host.runQueuedTimeoutCallbacks();
            }
            // Delayed update program
            host.runQueuedTimeoutCallbacks();
            verifyProgram(ts.tscWatch.checkOutputErrorsIncremental);
            function verifyProgram(checkOutputErrors: (host: ts.tscWatch.WatchedSystem, errors: readonly ts.Diagnostic[]) => void) {
                ts.tscWatch.checkProgramActualFiles(watch(), programFiles.map(f => f.path));
                checkOutputErrors(host, ts.emptyArray);
                const outputFile = ts.changeExtension(file.path, ".js");
                assert(host.fileExists(outputFile));
                assert.equal(host.readFile(outputFile), file.content);
                ts.tscWatch.checkWatchedDirectories(host, ts.emptyArray, /*recursive*/ true);
                // Watching config file, file, lib file and directories
                ts.tscWatch.checkWatchedFilesDetailed(host, expectedWatchedFiles, 1);
                ts.tscWatch.checkWatchedDirectoriesDetailed(host, expectedWatchedDirectories, 1, /*recursive*/ false);
            }
        }
        it("uses watchFile when renaming file in subfolder", () => {
            verifyRenamingFileInSubFolder(Tsc_WatchDirectory.WatchFile);
        });
        it("uses non recursive watchDirectory when renaming file in subfolder", () => {
            verifyRenamingFileInSubFolder(Tsc_WatchDirectory.NonRecursiveWatchDirectory);
        });
        it("uses non recursive dynamic polling when renaming file in subfolder", () => {
            verifyRenamingFileInSubFolder(Tsc_WatchDirectory.DynamicPolling);
        });
        it("when there are symlinks to folders in recursive folders", () => {
            const cwd = "/home/user/projects/myproject";
            const file1: ts.tscWatch.File = {
                path: `${cwd}/src/file.ts`,
                content: `import * as a from "a"`
            };
            const tsconfig: ts.tscWatch.File = {
                path: `${cwd}/tsconfig.json`,
                content: `{ "compilerOptions": { "extendedDiagnostics": true, "traceResolution": true }}`
            };
            const realA: ts.tscWatch.File = {
                path: `${cwd}/node_modules/reala/index.d.ts`,
                content: `export {}`
            };
            const realB: ts.tscWatch.File = {
                path: `${cwd}/node_modules/realb/index.d.ts`,
                content: `export {}`
            };
            const symLinkA: ts.tscWatch.SymLink = {
                path: `${cwd}/node_modules/a`,
                symLink: `${cwd}/node_modules/reala`
            };
            const symLinkB: ts.tscWatch.SymLink = {
                path: `${cwd}/node_modules/b`,
                symLink: `${cwd}/node_modules/realb`
            };
            const symLinkBInA: ts.tscWatch.SymLink = {
                path: `${cwd}/node_modules/reala/node_modules/b`,
                symLink: `${cwd}/node_modules/b`
            };
            const symLinkAInB: ts.tscWatch.SymLink = {
                path: `${cwd}/node_modules/realb/node_modules/a`,
                symLink: `${cwd}/node_modules/a`
            };
            const files = [file1, tsconfig, realA, realB, symLinkA, symLinkB, symLinkBInA, symLinkAInB];
            const environmentVariables = ts.createMap<string>();
            environmentVariables.set("TSC_WATCHDIRECTORY", Tsc_WatchDirectory.NonRecursiveWatchDirectory);
            const host = ts.tscWatch.createWatchedSystem(files, { environmentVariables, currentDirectory: cwd });
            ts.tscWatch.createWatchOfConfigFile("tsconfig.json", host);
            ts.tscWatch.checkWatchedDirectories(host, ts.emptyArray, /*recursive*/ true);
            ts.tscWatch.checkWatchedDirectories(host, [cwd, `${cwd}/node_modules`, `${cwd}/node_modules/@types`, `${cwd}/node_modules/reala`, `${cwd}/node_modules/realb`,
                `${cwd}/node_modules/reala/node_modules`, `${cwd}/node_modules/realb/node_modules`, `${cwd}/src`], /*recursive*/ false);
        });
        it("with non synchronous watch directory", () => {
            const configFile: ts.tscWatch.File = {
                path: `${ts.tscWatch.projectRoot}/tsconfig.json`,
                content: "{}"
            };
            const file1: ts.tscWatch.File = {
                path: `${ts.tscWatch.projectRoot}/src/file1.ts`,
                content: `import { x } from "file2";`
            };
            const file2: ts.tscWatch.File = {
                path: `${ts.tscWatch.projectRoot}/node_modules/file2/index.d.ts`,
                content: `export const x = 10;`
            };
            const files = [ts.tscWatch.libFile, file1, file2, configFile];
            const host = ts.tscWatch.createWatchedSystem(files, { runWithoutRecursiveWatches: true });
            const watch = ts.tscWatch.createWatchOfConfigFile(configFile.path, host);
            ts.tscWatch.checkProgramActualFiles(watch(), ts.mapDefined(files, f => f === configFile ? undefined : f.path));
            ts.tscWatch.checkOutputErrorsInitial(host, ts.emptyArray);
            const watchedDirectories = [`${ts.tscWatch.projectRoot}`, `${ts.tscWatch.projectRoot}/src`, `${ts.tscWatch.projectRoot}/node_modules`, `${ts.tscWatch.projectRoot}/node_modules/file2`, `${ts.tscWatch.projectRoot}/node_modules/@types`];
            checkWatchesWithFile2();
            host.checkTimeoutQueueLengthAndRun(1); // To update directory callbacks for file1.js output
            host.checkTimeoutQueueLengthAndRun(1); // Update program again
            host.checkTimeoutQueueLength(0);
            ts.tscWatch.checkOutputErrorsIncremental(host, ts.emptyArray);
            checkWatchesWithFile2();
            // Remove directory node_modules
            host.deleteFolder(`${ts.tscWatch.projectRoot}/node_modules`, /*recursive*/ true);
            host.checkTimeoutQueueLength(2); // 1. For updating program and 2. for updating child watches
            host.runQueuedTimeoutCallbacks(host.getNextTimeoutId() - 2); // Update program
            ts.tscWatch.checkOutputErrorsIncremental(host, [
                ts.tscWatch.getDiagnosticModuleNotFoundOfFile(watch(), file1, "file2")
            ]);
            checkWatchesWithoutFile2();
            host.checkTimeoutQueueLengthAndRun(1); // To update directory watchers
            host.checkTimeoutQueueLengthAndRun(1); // To Update program
            host.checkTimeoutQueueLength(0);
            checkWatchesWithoutFile2();
            ts.tscWatch.checkOutputErrorsIncremental(host, [
                ts.tscWatch.getDiagnosticModuleNotFoundOfFile(watch(), file1, "file2")
            ]);
            // npm install
            host.createDirectory(`${ts.tscWatch.projectRoot}/node_modules`);
            host.checkTimeoutQueueLength(1); // To update folder structure
            assert.deepEqual(host.getOutput(), ts.emptyArray);
            checkWatchesWithoutFile2();
            host.createDirectory(`${ts.tscWatch.projectRoot}/node_modules/file2`);
            host.checkTimeoutQueueLength(1); // To update folder structure
            assert.deepEqual(host.getOutput(), ts.emptyArray);
            checkWatchesWithoutFile2();
            host.writeFile(file2.path, file2.content);
            host.checkTimeoutQueueLength(1); // To update folder structure
            assert.deepEqual(host.getOutput(), ts.emptyArray);
            checkWatchesWithoutFile2();
            host.runQueuedTimeoutCallbacks();
            host.checkTimeoutQueueLength(1); // To Update the program
            assert.deepEqual(host.getOutput(), ts.emptyArray);
            checkWatchedFiles(files.filter(f => f !== file2)); // Files like without file2
            ts.tscWatch.checkWatchedDirectories(host, ts.emptyArray, /*recursive*/ true);
            checkNonRecursiveWatchedDirectories(watchedDirectories); // Directories like with file2
            host.runQueuedTimeoutCallbacks();
            host.checkTimeoutQueueLength(0);
            ts.tscWatch.checkOutputErrorsIncremental(host, ts.emptyArray);
            checkWatchesWithFile2();
            function checkWatchesWithFile2() {
                checkWatchedFiles(files);
                ts.tscWatch.checkWatchedDirectories(host, ts.emptyArray, /*recursive*/ true);
                checkNonRecursiveWatchedDirectories(watchedDirectories);
            }
            function checkWatchesWithoutFile2() {
                checkWatchedFiles(files.filter(f => f !== file2));
                ts.tscWatch.checkWatchedDirectories(host, ts.emptyArray, /*recursive*/ true);
                checkNonRecursiveWatchedDirectories(watchedDirectories.filter(f => f !== `${ts.tscWatch.projectRoot}/node_modules/file2`));
            }
            function checkWatchedFiles(files: readonly ts.tscWatch.File[]) {
                ts.tscWatch.checkWatchedFilesDetailed(host, files.map(f => f.path.toLowerCase()), 1, ts.arrayToMap(files, f => f.path.toLowerCase(), () => [ts.PollingInterval.Low]));
            }
            function checkNonRecursiveWatchedDirectories(directories: readonly string[]) {
                ts.tscWatch.checkWatchedDirectoriesDetailed(host, directories, 1, 
                /*recursive*/ false, ts.arrayToMap(directories, ts.identity, () => [{
                        fallbackPollingInterval: ts.PollingInterval.Medium,
                        fallbackOptions: { watchFile: ts.WatchFileKind.PriorityPollingInterval }
                    }]));
            }
        });
    });
    describe("handles watch compiler options", () => {
        it("with watchFile option", () => {
            const configFile: ts.tscWatch.File = {
                path: "/a/b/tsconfig.json",
                content: JSON.stringify({
                    watchOptions: {
                        watchFile: "UseFsEvents"
                    }
                })
            };
            const files = [ts.tscWatch.libFile, ts.tscWatch.commonFile1, ts.tscWatch.commonFile2, configFile];
            const host = ts.tscWatch.createWatchedSystem(files);
            const watch = ts.tscWatch.createWatchOfConfigFile(configFile.path, host, { extendedDiagnostics: true });
            ts.tscWatch.checkProgramActualFiles(watch(), ts.mapDefined(files, f => f === configFile ? undefined : f.path));
            // Instead of polling watch (= watchedFiles), uses fsWatch
            ts.tscWatch.checkWatchedFiles(host, ts.emptyArray);
            ts.tscWatch.checkWatchedDirectoriesDetailed(host, files.map(f => f.path.toLowerCase()), 1, 
            /*recursive*/ false, ts.arrayToMap(files, f => f.path.toLowerCase(), f => [{
                    fallbackPollingInterval: f === configFile ? ts.PollingInterval.High : ts.PollingInterval.Low,
                    fallbackOptions: { watchFile: ts.WatchFileKind.PriorityPollingInterval }
                }]));
            ts.tscWatch.checkWatchedDirectoriesDetailed(host, ["/a/b", "/a/b/node_modules/@types"], 1, 
            /*recursive*/ true, ts.arrayToMap(["/a/b", "/a/b/node_modules/@types"], ts.identity, () => [{
                    fallbackPollingInterval: ts.PollingInterval.Medium,
                    fallbackOptions: { watchFile: ts.WatchFileKind.PriorityPollingInterval }
                }]));
        });
        it("with watchDirectory option", () => {
            const configFile: ts.tscWatch.File = {
                path: "/a/b/tsconfig.json",
                content: JSON.stringify({
                    watchOptions: {
                        watchDirectory: "UseFsEvents"
                    }
                })
            };
            const files = [ts.tscWatch.libFile, ts.tscWatch.commonFile1, ts.tscWatch.commonFile2, configFile];
            const host = ts.tscWatch.createWatchedSystem(files, { runWithoutRecursiveWatches: true });
            const watch = ts.tscWatch.createWatchOfConfigFile(configFile.path, host, { extendedDiagnostics: true });
            ts.tscWatch.checkProgramActualFiles(watch(), ts.mapDefined(files, f => f === configFile ? undefined : f.path));
            ts.tscWatch.checkWatchedFilesDetailed(host, files.map(f => f.path.toLowerCase()), 1, ts.arrayToMap(files, f => f.path.toLowerCase(), () => [ts.PollingInterval.Low]));
            ts.tscWatch.checkWatchedDirectoriesDetailed(host, ["/a/b", "/a/b/node_modules/@types"], 1, 
            /*recursive*/ false, ts.arrayToMap(["/a/b", "/a/b/node_modules/@types"], ts.identity, () => [{
                    fallbackPollingInterval: ts.PollingInterval.Medium,
                    fallbackOptions: { watchFile: ts.WatchFileKind.PriorityPollingInterval }
                }]));
            ts.tscWatch.checkWatchedDirectories(host, ts.emptyArray, /*recursive*/ true);
        });
        it("with fallbackPolling option", () => {
            const configFile: ts.tscWatch.File = {
                path: "/a/b/tsconfig.json",
                content: JSON.stringify({
                    watchOptions: {
                        fallbackPolling: "PriorityInterval"
                    }
                })
            };
            const files = [ts.tscWatch.libFile, ts.tscWatch.commonFile1, ts.tscWatch.commonFile2, configFile];
            const host = ts.tscWatch.createWatchedSystem(files, { runWithoutRecursiveWatches: true, runWithFallbackPolling: true });
            const watch = ts.tscWatch.createWatchOfConfigFile(configFile.path, host, { extendedDiagnostics: true });
            ts.tscWatch.checkProgramActualFiles(watch(), ts.mapDefined(files, f => f === configFile ? undefined : f.path));
            const filePaths = files.map(f => f.path.toLowerCase());
            ts.tscWatch.checkWatchedFilesDetailed(host, filePaths.concat(["/a/b", "/a/b/node_modules/@types"]), 1, ts.arrayToMap(filePaths.concat(["/a/b", "/a/b/node_modules/@types"]), ts.identity, f => [ts.contains(filePaths, f) ? ts.PollingInterval.Low : ts.PollingInterval.Medium]));
            ts.tscWatch.checkWatchedDirectories(host, ts.emptyArray, /*recursive*/ false);
            ts.tscWatch.checkWatchedDirectories(host, ts.emptyArray, /*recursive*/ true);
        });
        it("with watchFile as watch options to extend", () => {
            const configFile: ts.tscWatch.File = {
                path: "/a/b/tsconfig.json",
                content: "{}"
            };
            const files = [ts.tscWatch.libFile, ts.tscWatch.commonFile1, ts.tscWatch.commonFile2, configFile];
            const host = ts.tscWatch.createWatchedSystem(files);
            const watch = ts.tscWatch.createWatchOfConfigFile(configFile.path, host, { extendedDiagnostics: true }, { watchFile: ts.WatchFileKind.UseFsEvents });
            ts.tscWatch.checkProgramActualFiles(watch(), ts.mapDefined(files, f => f === configFile ? undefined : f.path));
            // Instead of polling watch (= watchedFiles), uses fsWatch
            ts.tscWatch.checkWatchedFiles(host, ts.emptyArray);
            ts.tscWatch.checkWatchedDirectoriesDetailed(host, files.map(f => f.path.toLowerCase()), 1, 
            /*recursive*/ false, ts.arrayToMap(files, f => f.path.toLowerCase(), f => [{
                    fallbackPollingInterval: f === configFile ? ts.PollingInterval.High : ts.PollingInterval.Low,
                    fallbackOptions: { watchFile: ts.WatchFileKind.PriorityPollingInterval }
                }]));
            ts.tscWatch.checkWatchedDirectoriesDetailed(host, ["/a/b", "/a/b/node_modules/@types"], 1, 
            /*recursive*/ true, ts.arrayToMap(["/a/b", "/a/b/node_modules/@types"], ts.identity, () => [{
                    fallbackPollingInterval: ts.PollingInterval.Medium,
                    fallbackOptions: { watchFile: ts.WatchFileKind.PriorityPollingInterval }
                }]));
        });
    });
});
