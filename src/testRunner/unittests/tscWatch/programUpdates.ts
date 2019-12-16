namespace ts.tscWatch {
    describe("unittests:: tsc-watch:: program updates", () => {
        it("create watch without config file", () => {
            const appFile: ts.tscWatch.File = {
                path: "/a/b/c/app.ts",
                content: `
                import {f} from "./module"
                console.log(f)
                `
            };
            const moduleFile: ts.tscWatch.File = {
                path: "/a/b/c/module.d.ts",
                content: `export let x: number`
            };
            const host = ts.tscWatch.createWatchedSystem([appFile, moduleFile, ts.tscWatch.libFile]);
            const watch = ts.tscWatch.createWatchOfFilesAndCompilerOptions([appFile.path], host);
            ts.tscWatch.checkProgramActualFiles(watch(), [appFile.path, ts.tscWatch.libFile.path, moduleFile.path]);
            // TODO: Should we watch creation of config files in the root file's file hierarchy?
            // const configFileLocations = ["/a/b/c/", "/a/b/", "/a/", "/"];
            // const configFiles = flatMap(configFileLocations, location => [location + "tsconfig.json", location + "jsconfig.json"]);
            // checkWatchedFiles(host, configFiles.concat(libFile.path, moduleFile.path));
        });
        it("can handle tsconfig file name with difference casing", () => {
            const f1 = {
                path: "/a/b/app.ts",
                content: "let x = 1"
            };
            const config = {
                path: "/a/b/tsconfig.json",
                content: JSON.stringify({
                    include: ["app.ts"]
                })
            };
            const host = ts.tscWatch.createWatchedSystem([f1, config], { useCaseSensitiveFileNames: false });
            const upperCaseConfigFilePath = ts.combinePaths(ts.getDirectoryPath(config.path).toUpperCase(), ts.getBaseFileName(config.path));
            const watch = ts.tscWatch.createWatchOfConfigFile(upperCaseConfigFilePath, host);
            ts.tscWatch.checkProgramActualFiles(watch(), [ts.combinePaths(ts.getDirectoryPath(upperCaseConfigFilePath), ts.getBaseFileName(f1.path))]);
        });
        it("create configured project without file list", () => {
            const configFile: ts.tscWatch.File = {
                path: "/a/b/tsconfig.json",
                content: `
                {
                    "compilerOptions": {},
                    "exclude": [
                        "e"
                    ]
                }`
            };
            const file1: ts.tscWatch.File = {
                path: "/a/b/c/f1.ts",
                content: "let x = 1"
            };
            const file2: ts.tscWatch.File = {
                path: "/a/b/d/f2.ts",
                content: "let y = 1"
            };
            const file3: ts.tscWatch.File = {
                path: "/a/b/e/f3.ts",
                content: "let z = 1"
            };
            const host = ts.tscWatch.createWatchedSystem([configFile, ts.tscWatch.libFile, file1, file2, file3]);
            const watch = ts.createWatchProgram(ts.createWatchCompilerHostOfConfigFile(configFile.path, {}, /*watchOptionsToExtend*/ undefined, host, /*createProgram*/ undefined, ts.notImplemented));
            ts.tscWatch.checkProgramActualFiles(watch.getCurrentProgram().getProgram(), [file1.path, ts.tscWatch.libFile.path, file2.path]);
            ts.tscWatch.checkProgramRootFiles(watch.getCurrentProgram().getProgram(), [file1.path, file2.path]);
            ts.tscWatch.checkWatchedFiles(host, [configFile.path, file1.path, file2.path, ts.tscWatch.libFile.path]);
            const configDir = ts.getDirectoryPath(configFile.path);
            ts.tscWatch.checkWatchedDirectories(host, [configDir, ts.combinePaths(configDir, ts.projectSystem.nodeModulesAtTypes)], /*recursive*/ true);
        });
        // TODO: if watching for config file creation
        // it("add and then remove a config file in a folder with loose files", () => {
        // });
        it("add new files to a configured program without file list", () => {
            const configFile: ts.tscWatch.File = {
                path: "/a/b/tsconfig.json",
                content: `{}`
            };
            const host = ts.tscWatch.createWatchedSystem([ts.tscWatch.commonFile1, ts.tscWatch.libFile, configFile]);
            const watch = ts.tscWatch.createWatchOfConfigFile(configFile.path, host);
            const configDir = ts.getDirectoryPath(configFile.path);
            ts.tscWatch.checkWatchedDirectories(host, [configDir, ts.combinePaths(configDir, ts.projectSystem.nodeModulesAtTypes)], /*recursive*/ true);
            ts.tscWatch.checkProgramRootFiles(watch(), [ts.tscWatch.commonFile1.path]);
            // add a new ts file
            host.reloadFS([ts.tscWatch.commonFile1, ts.tscWatch.commonFile2, ts.tscWatch.libFile, configFile]);
            host.checkTimeoutQueueLengthAndRun(1);
            ts.tscWatch.checkProgramRootFiles(watch(), [ts.tscWatch.commonFile1.path, ts.tscWatch.commonFile2.path]);
        });
        it("should ignore non-existing files specified in the config file", () => {
            const configFile: ts.tscWatch.File = {
                path: "/a/b/tsconfig.json",
                content: `{
                    "compilerOptions": {},
                    "files": [
                        "commonFile1.ts",
                        "commonFile3.ts"
                    ]
                }`
            };
            const host = ts.tscWatch.createWatchedSystem([ts.tscWatch.commonFile1, ts.tscWatch.commonFile2, configFile]);
            const watch = ts.tscWatch.createWatchOfConfigFile(configFile.path, host);
            const commonFile3 = "/a/b/commonFile3.ts";
            ts.tscWatch.checkProgramRootFiles(watch(), [ts.tscWatch.commonFile1.path, commonFile3]);
            ts.tscWatch.checkProgramActualFiles(watch(), [ts.tscWatch.commonFile1.path]);
        });
        it("handle recreated files correctly", () => {
            const configFile: ts.tscWatch.File = {
                path: "/a/b/tsconfig.json",
                content: `{}`
            };
            const host = ts.tscWatch.createWatchedSystem([ts.tscWatch.commonFile1, ts.tscWatch.commonFile2, configFile]);
            const watch = ts.tscWatch.createWatchOfConfigFile(configFile.path, host);
            ts.tscWatch.checkProgramRootFiles(watch(), [ts.tscWatch.commonFile1.path, ts.tscWatch.commonFile2.path]);
            // delete commonFile2
            host.reloadFS([ts.tscWatch.commonFile1, configFile]);
            host.checkTimeoutQueueLengthAndRun(1);
            ts.tscWatch.checkProgramRootFiles(watch(), [ts.tscWatch.commonFile1.path]);
            // re-add commonFile2
            host.reloadFS([ts.tscWatch.commonFile1, ts.tscWatch.commonFile2, configFile]);
            host.checkTimeoutQueueLengthAndRun(1);
            ts.tscWatch.checkProgramRootFiles(watch(), [ts.tscWatch.commonFile1.path, ts.tscWatch.commonFile2.path]);
        });
        it("handles the missing files - that were added to program because they were added with ///<ref", () => {
            const commonFile2Name = "commonFile2.ts";
            const file1: ts.tscWatch.File = {
                path: "/a/b/commonFile1.ts",
                content: `/// <reference path="${commonFile2Name}"/>
                    let x = y`
            };
            const host = ts.tscWatch.createWatchedSystem([file1, ts.tscWatch.libFile]);
            const watch = ts.tscWatch.createWatchOfFilesAndCompilerOptions([file1.path], host);
            ts.tscWatch.checkProgramRootFiles(watch(), [file1.path]);
            ts.tscWatch.checkProgramActualFiles(watch(), [file1.path, ts.tscWatch.libFile.path]);
            ts.tscWatch.checkOutputErrorsInitial(host, [
                ts.tscWatch.getDiagnosticOfFileFromProgram(watch(), file1.path, file1.content.indexOf(commonFile2Name), commonFile2Name.length, ts.Diagnostics.File_0_not_found, ts.tscWatch.commonFile2.path),
                ts.tscWatch.getDiagnosticOfFileFromProgram(watch(), file1.path, file1.content.indexOf("y"), 1, ts.Diagnostics.Cannot_find_name_0, "y")
            ]);
            host.reloadFS([file1, ts.tscWatch.commonFile2, ts.tscWatch.libFile]);
            host.runQueuedTimeoutCallbacks();
            ts.tscWatch.checkProgramRootFiles(watch(), [file1.path]);
            ts.tscWatch.checkProgramActualFiles(watch(), [file1.path, ts.tscWatch.libFile.path, ts.tscWatch.commonFile2.path]);
            ts.tscWatch.checkOutputErrorsIncremental(host, ts.emptyArray);
        });
        it("should reflect change in config file", () => {
            const configFile: ts.tscWatch.File = {
                path: "/a/b/tsconfig.json",
                content: `{
                    "compilerOptions": {},
                    "files": ["${ts.tscWatch.commonFile1.path}", "${ts.tscWatch.commonFile2.path}"]
                }`
            };
            const files = [ts.tscWatch.commonFile1, ts.tscWatch.commonFile2, configFile];
            const host = ts.tscWatch.createWatchedSystem(files);
            const watch = ts.tscWatch.createWatchOfConfigFile(configFile.path, host);
            ts.tscWatch.checkProgramRootFiles(watch(), [ts.tscWatch.commonFile1.path, ts.tscWatch.commonFile2.path]);
            configFile.content = `{
                "compilerOptions": {},
                "files": ["${ts.tscWatch.commonFile1.path}"]
            }`;
            host.reloadFS(files);
            host.checkTimeoutQueueLengthAndRun(1); // reload the configured project
            ts.tscWatch.checkProgramRootFiles(watch(), [ts.tscWatch.commonFile1.path]);
        });
        it("works correctly when config file is changed but its content havent", () => {
            const configFile: ts.tscWatch.File = {
                path: "/a/b/tsconfig.json",
                content: `{
                    "compilerOptions": {},
                    "files": ["${ts.tscWatch.commonFile1.path}", "${ts.tscWatch.commonFile2.path}"]
                }`
            };
            const files = [ts.tscWatch.libFile, ts.tscWatch.commonFile1, ts.tscWatch.commonFile2, configFile];
            const host = ts.tscWatch.createWatchedSystem(files);
            const watch = ts.tscWatch.createWatchOfConfigFile(configFile.path, host);
            ts.tscWatch.checkProgramActualFiles(watch(), [ts.tscWatch.libFile.path, ts.tscWatch.commonFile1.path, ts.tscWatch.commonFile2.path]);
            ts.tscWatch.checkOutputErrorsInitial(host, ts.emptyArray);
            host.modifyFile(configFile.path, configFile.content);
            host.checkTimeoutQueueLengthAndRun(1); // reload the configured project
            ts.tscWatch.checkProgramActualFiles(watch(), [ts.tscWatch.libFile.path, ts.tscWatch.commonFile1.path, ts.tscWatch.commonFile2.path]);
            ts.tscWatch.checkOutputErrorsIncremental(host, ts.emptyArray);
        });
        it("Updates diagnostics when '--noUnusedLabels' changes", () => {
            const aTs: ts.tscWatch.File = { path: "/a.ts", content: "label: while (1) {}" };
            const files = [ts.tscWatch.libFile, aTs];
            const paths = files.map(f => f.path);
            const options = (allowUnusedLabels: boolean) => `{ "compilerOptions": { "allowUnusedLabels": ${allowUnusedLabels} } }`;
            const tsconfig: ts.tscWatch.File = { path: "/tsconfig.json", content: options(/*allowUnusedLabels*/ true) };
            const host = ts.tscWatch.createWatchedSystem([...files, tsconfig]);
            const watch = ts.tscWatch.createWatchOfConfigFile(tsconfig.path, host);
            ts.tscWatch.checkProgramActualFiles(watch(), paths);
            ts.tscWatch.checkOutputErrorsInitial(host, ts.emptyArray);
            host.modifyFile(tsconfig.path, options(/*allowUnusedLabels*/ false));
            host.checkTimeoutQueueLengthAndRun(1); // reload the configured project
            ts.tscWatch.checkProgramActualFiles(watch(), paths);
            ts.tscWatch.checkOutputErrorsIncremental(host, [
                ts.tscWatch.getDiagnosticOfFileFromProgram(watch(), aTs.path, 0, "label".length, ts.Diagnostics.Unused_label),
            ]);
            host.modifyFile(tsconfig.path, options(/*allowUnusedLabels*/ true));
            host.checkTimeoutQueueLengthAndRun(1); // reload the configured project
            ts.tscWatch.checkProgramActualFiles(watch(), paths);
            ts.tscWatch.checkOutputErrorsIncremental(host, ts.emptyArray);
        });
        it("files explicitly excluded in config file", () => {
            const configFile: ts.tscWatch.File = {
                path: "/a/b/tsconfig.json",
                content: `{
                    "compilerOptions": {},
                    "exclude": ["/a/c"]
                }`
            };
            const excludedFile1: ts.tscWatch.File = {
                path: "/a/c/excluedFile1.ts",
                content: `let t = 1;`
            };
            const host = ts.tscWatch.createWatchedSystem([ts.tscWatch.commonFile1, ts.tscWatch.commonFile2, excludedFile1, configFile]);
            const watch = ts.tscWatch.createWatchOfConfigFile(configFile.path, host);
            ts.tscWatch.checkProgramRootFiles(watch(), [ts.tscWatch.commonFile1.path, ts.tscWatch.commonFile2.path]);
        });
        it("should properly handle module resolution changes in config file", () => {
            const file1: ts.tscWatch.File = {
                path: "/a/b/file1.ts",
                content: `import { T } from "module1";`
            };
            const nodeModuleFile: ts.tscWatch.File = {
                path: "/a/b/node_modules/module1.ts",
                content: `export interface T {}`
            };
            const classicModuleFile: ts.tscWatch.File = {
                path: "/a/module1.ts",
                content: `export interface T {}`
            };
            const configFile: ts.tscWatch.File = {
                path: "/a/b/tsconfig.json",
                content: `{
                    "compilerOptions": {
                        "moduleResolution": "node"
                    },
                    "files": ["${file1.path}"]
                }`
            };
            const files = [file1, nodeModuleFile, classicModuleFile, configFile];
            const host = ts.tscWatch.createWatchedSystem(files);
            const watch = ts.tscWatch.createWatchOfConfigFile(configFile.path, host);
            ts.tscWatch.checkProgramRootFiles(watch(), [file1.path]);
            ts.tscWatch.checkProgramActualFiles(watch(), [file1.path, nodeModuleFile.path]);
            configFile.content = `{
                "compilerOptions": {
                    "moduleResolution": "classic"
                },
                "files": ["${file1.path}"]
            }`;
            host.reloadFS(files);
            host.checkTimeoutQueueLengthAndRun(1);
            ts.tscWatch.checkProgramRootFiles(watch(), [file1.path]);
            ts.tscWatch.checkProgramActualFiles(watch(), [file1.path, classicModuleFile.path]);
        });
        it("should tolerate config file errors and still try to build a project", () => {
            const configFile: ts.tscWatch.File = {
                path: "/a/b/tsconfig.json",
                content: `{
                    "compilerOptions": {
                        "target": "es6",
                        "allowAnything": true
                    },
                    "someOtherProperty": {}
                }`
            };
            const host = ts.tscWatch.createWatchedSystem([ts.tscWatch.commonFile1, ts.tscWatch.commonFile2, ts.tscWatch.libFile, configFile]);
            const watch = ts.tscWatch.createWatchOfConfigFile(configFile.path, host);
            ts.tscWatch.checkProgramRootFiles(watch(), [ts.tscWatch.commonFile1.path, ts.tscWatch.commonFile2.path]);
        });
        it("changes in files are reflected in project structure", () => {
            const file1 = {
                path: "/a/b/f1.ts",
                content: `export * from "./f2"`
            };
            const file2 = {
                path: "/a/b/f2.ts",
                content: `export let x = 1`
            };
            const file3 = {
                path: "/a/c/f3.ts",
                content: `export let y = 1;`
            };
            const host = ts.tscWatch.createWatchedSystem([file1, file2, file3]);
            const watch = ts.tscWatch.createWatchOfFilesAndCompilerOptions([file1.path], host);
            ts.tscWatch.checkProgramRootFiles(watch(), [file1.path]);
            ts.tscWatch.checkProgramActualFiles(watch(), [file1.path, file2.path]);
            const modifiedFile2 = {
                path: file2.path,
                content: `export * from "../c/f3"` // now inferred project should inclule file3
            };
            host.reloadFS([file1, modifiedFile2, file3]);
            host.checkTimeoutQueueLengthAndRun(1);
            ts.tscWatch.checkProgramRootFiles(watch(), [file1.path]);
            ts.tscWatch.checkProgramActualFiles(watch(), [file1.path, modifiedFile2.path, file3.path]);
        });
        it("deleted files affect project structure", () => {
            const file1 = {
                path: "/a/b/f1.ts",
                content: `export * from "./f2"`
            };
            const file2 = {
                path: "/a/b/f2.ts",
                content: `export * from "../c/f3"`
            };
            const file3 = {
                path: "/a/c/f3.ts",
                content: `export let y = 1;`
            };
            const host = ts.tscWatch.createWatchedSystem([file1, file2, file3]);
            const watch = ts.tscWatch.createWatchOfFilesAndCompilerOptions([file1.path], host);
            ts.tscWatch.checkProgramActualFiles(watch(), [file1.path, file2.path, file3.path]);
            host.reloadFS([file1, file3]);
            host.checkTimeoutQueueLengthAndRun(1);
            ts.tscWatch.checkProgramActualFiles(watch(), [file1.path]);
        });
        it("deleted files affect project structure - 2", () => {
            const file1 = {
                path: "/a/b/f1.ts",
                content: `export * from "./f2"`
            };
            const file2 = {
                path: "/a/b/f2.ts",
                content: `export * from "../c/f3"`
            };
            const file3 = {
                path: "/a/c/f3.ts",
                content: `export let y = 1;`
            };
            const host = ts.tscWatch.createWatchedSystem([file1, file2, file3]);
            const watch = ts.tscWatch.createWatchOfFilesAndCompilerOptions([file1.path, file3.path], host);
            ts.tscWatch.checkProgramActualFiles(watch(), [file1.path, file2.path, file3.path]);
            host.reloadFS([file1, file3]);
            host.checkTimeoutQueueLengthAndRun(1);
            ts.tscWatch.checkProgramActualFiles(watch(), [file1.path, file3.path]);
        });
        it("config file includes the file", () => {
            const file1 = {
                path: "/a/b/f1.ts",
                content: "export let x = 5"
            };
            const file2 = {
                path: "/a/c/f2.ts",
                content: `import {x} from "../b/f1"`
            };
            const file3 = {
                path: "/a/c/f3.ts",
                content: "export let y = 1"
            };
            const configFile = {
                path: "/a/c/tsconfig.json",
                content: JSON.stringify({ compilerOptions: {}, files: ["f2.ts", "f3.ts"] })
            };
            const host = ts.tscWatch.createWatchedSystem([file1, file2, file3, configFile]);
            const watch = ts.tscWatch.createWatchOfConfigFile(configFile.path, host);
            ts.tscWatch.checkProgramRootFiles(watch(), [file2.path, file3.path]);
            ts.tscWatch.checkProgramActualFiles(watch(), [file1.path, file2.path, file3.path]);
        });
        it("correctly migrate files between projects", () => {
            const file1 = {
                path: "/a/b/f1.ts",
                content: `
                export * from "../c/f2";
                export * from "../d/f3";`
            };
            const file2 = {
                path: "/a/c/f2.ts",
                content: "export let x = 1;"
            };
            const file3 = {
                path: "/a/d/f3.ts",
                content: "export let y = 1;"
            };
            const host = ts.tscWatch.createWatchedSystem([file1, file2, file3]);
            const watch = ts.tscWatch.createWatchOfFilesAndCompilerOptions([file2.path, file3.path], host);
            ts.tscWatch.checkProgramActualFiles(watch(), [file2.path, file3.path]);
            const watch2 = ts.tscWatch.createWatchOfFilesAndCompilerOptions([file1.path], host);
            ts.tscWatch.checkProgramActualFiles(watch2(), [file1.path, file2.path, file3.path]);
            // Previous program shouldnt be updated
            ts.tscWatch.checkProgramActualFiles(watch(), [file2.path, file3.path]);
            host.checkTimeoutQueueLength(0);
        });
        it("can correctly update configured project when set of root files has changed (new file on disk)", () => {
            const file1 = {
                path: "/a/b/f1.ts",
                content: "let x = 1"
            };
            const file2 = {
                path: "/a/b/f2.ts",
                content: "let y = 1"
            };
            const configFile = {
                path: "/a/b/tsconfig.json",
                content: JSON.stringify({ compilerOptions: {} })
            };
            const host = ts.tscWatch.createWatchedSystem([file1, configFile]);
            const watch = ts.tscWatch.createWatchOfConfigFile(configFile.path, host);
            ts.tscWatch.checkProgramActualFiles(watch(), [file1.path]);
            host.reloadFS([file1, file2, configFile]);
            host.checkTimeoutQueueLengthAndRun(1);
            ts.tscWatch.checkProgramActualFiles(watch(), [file1.path, file2.path]);
            ts.tscWatch.checkProgramRootFiles(watch(), [file1.path, file2.path]);
        });
        it("can correctly update configured project when set of root files has changed (new file in list of files)", () => {
            const file1 = {
                path: "/a/b/f1.ts",
                content: "let x = 1"
            };
            const file2 = {
                path: "/a/b/f2.ts",
                content: "let y = 1"
            };
            const configFile = {
                path: "/a/b/tsconfig.json",
                content: JSON.stringify({ compilerOptions: {}, files: ["f1.ts"] })
            };
            const host = ts.tscWatch.createWatchedSystem([file1, file2, configFile]);
            const watch = ts.tscWatch.createWatchOfConfigFile(configFile.path, host);
            ts.tscWatch.checkProgramActualFiles(watch(), [file1.path]);
            const modifiedConfigFile = {
                path: configFile.path,
                content: JSON.stringify({ compilerOptions: {}, files: ["f1.ts", "f2.ts"] })
            };
            host.reloadFS([file1, file2, modifiedConfigFile]);
            host.checkTimeoutQueueLengthAndRun(1);
            ts.tscWatch.checkProgramRootFiles(watch(), [file1.path, file2.path]);
            ts.tscWatch.checkProgramActualFiles(watch(), [file1.path, file2.path]);
        });
        it("can update configured project when set of root files was not changed", () => {
            const file1 = {
                path: "/a/b/f1.ts",
                content: "let x = 1"
            };
            const file2 = {
                path: "/a/b/f2.ts",
                content: "let y = 1"
            };
            const configFile = {
                path: "/a/b/tsconfig.json",
                content: JSON.stringify({ compilerOptions: {}, files: ["f1.ts", "f2.ts"] })
            };
            const host = ts.tscWatch.createWatchedSystem([file1, file2, configFile]);
            const watch = ts.tscWatch.createWatchOfConfigFile(configFile.path, host);
            ts.tscWatch.checkProgramActualFiles(watch(), [file1.path, file2.path]);
            const modifiedConfigFile = {
                path: configFile.path,
                content: JSON.stringify({ compilerOptions: { outFile: "out.js" }, files: ["f1.ts", "f2.ts"] })
            };
            host.reloadFS([file1, file2, modifiedConfigFile]);
            host.checkTimeoutQueueLengthAndRun(1);
            ts.tscWatch.checkProgramRootFiles(watch(), [file1.path, file2.path]);
            ts.tscWatch.checkProgramActualFiles(watch(), [file1.path, file2.path]);
        });
        it("config file is deleted", () => {
            const file1 = {
                path: "/a/b/f1.ts",
                content: "let x = 1;"
            };
            const file2 = {
                path: "/a/b/f2.ts",
                content: "let y = 2;"
            };
            const config = {
                path: "/a/b/tsconfig.json",
                content: JSON.stringify({ compilerOptions: {} })
            };
            const host = ts.tscWatch.createWatchedSystem([file1, file2, ts.tscWatch.libFile, config]);
            const watch = ts.tscWatch.createWatchOfConfigFile(config.path, host);
            ts.tscWatch.checkProgramActualFiles(watch(), [file1.path, file2.path, ts.tscWatch.libFile.path]);
            ts.tscWatch.checkOutputErrorsInitial(host, ts.emptyArray);
            host.reloadFS([file1, file2, ts.tscWatch.libFile]);
            host.checkTimeoutQueueLengthAndRun(1);
            ts.tscWatch.checkOutputErrorsIncrementalWithExit(host, [
                ts.tscWatch.getDiagnosticWithoutFile(ts.Diagnostics.File_0_not_found, config.path)
            ], ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
        });
        it("Proper errors: document is not contained in project", () => {
            const file1 = {
                path: "/a/b/app.ts",
                content: ""
            };
            const corruptedConfig = {
                path: "/a/b/tsconfig.json",
                content: "{"
            };
            const host = ts.tscWatch.createWatchedSystem([file1, corruptedConfig]);
            const watch = ts.tscWatch.createWatchOfConfigFile(corruptedConfig.path, host);
            ts.tscWatch.checkProgramActualFiles(watch(), [file1.path]);
        });
        it("correctly handles changes in lib section of config file", () => {
            const libES5 = {
                path: "/compiler/lib.es5.d.ts",
                content: "declare const eval: any"
            };
            const libES2015Promise = {
                path: "/compiler/lib.es2015.promise.d.ts",
                content: "declare class Promise<T> {}"
            };
            const app = {
                path: "/src/app.ts",
                content: "var x: Promise<string>;"
            };
            const config1 = {
                path: "/src/tsconfig.json",
                content: JSON.stringify({
                    compilerOptions: {
                        module: "commonjs",
                        target: "es5",
                        noImplicitAny: true,
                        sourceMap: false,
                        lib: [
                            "es5"
                        ]
                    }
                })
            };
            const config2 = {
                path: config1.path,
                content: JSON.stringify({
                    compilerOptions: {
                        module: "commonjs",
                        target: "es5",
                        noImplicitAny: true,
                        sourceMap: false,
                        lib: [
                            "es5",
                            "es2015.promise"
                        ]
                    }
                })
            };
            const host = ts.tscWatch.createWatchedSystem([libES5, libES2015Promise, app, config1], { executingFilePath: "/compiler/tsc.js" });
            const watch = ts.tscWatch.createWatchOfConfigFile(config1.path, host);
            ts.tscWatch.checkProgramActualFiles(watch(), [libES5.path, app.path]);
            host.reloadFS([libES5, libES2015Promise, app, config2]);
            host.checkTimeoutQueueLengthAndRun(1);
            ts.tscWatch.checkProgramActualFiles(watch(), [libES5.path, libES2015Promise.path, app.path]);
        });
        it("should handle non-existing directories in config file", () => {
            const f = {
                path: "/a/src/app.ts",
                content: "let x = 1;"
            };
            const config = {
                path: "/a/tsconfig.json",
                content: JSON.stringify({
                    compilerOptions: {},
                    include: [
                        "src/**/*",
                        "notexistingfolder/*"
                    ]
                })
            };
            const host = ts.tscWatch.createWatchedSystem([f, config]);
            const watch = ts.tscWatch.createWatchOfConfigFile(config.path, host);
            ts.tscWatch.checkProgramActualFiles(watch(), [f.path]);
        });
        it("rename a module file and rename back should restore the states for inferred projects", () => {
            const moduleFile = {
                path: "/a/b/moduleFile.ts",
                content: "export function bar() { };"
            };
            const file1 = {
                path: "/a/b/file1.ts",
                content: 'import * as T from "./moduleFile"; T.bar();'
            };
            const host = ts.tscWatch.createWatchedSystem([moduleFile, file1, ts.tscWatch.libFile]);
            const watch = ts.tscWatch.createWatchOfFilesAndCompilerOptions([file1.path], host);
            ts.tscWatch.checkOutputErrorsInitial(host, ts.emptyArray);
            const moduleFileOldPath = moduleFile.path;
            const moduleFileNewPath = "/a/b/moduleFile1.ts";
            moduleFile.path = moduleFileNewPath;
            host.reloadFS([moduleFile, file1, ts.tscWatch.libFile]);
            host.runQueuedTimeoutCallbacks();
            ts.tscWatch.checkOutputErrorsIncremental(host, [
                ts.tscWatch.getDiagnosticModuleNotFoundOfFile(watch(), file1, "./moduleFile")
            ]);
            moduleFile.path = moduleFileOldPath;
            host.reloadFS([moduleFile, file1, ts.tscWatch.libFile]);
            host.runQueuedTimeoutCallbacks();
            ts.tscWatch.checkOutputErrorsIncremental(host, ts.emptyArray);
        });
        it("rename a module file and rename back should restore the states for configured projects", () => {
            const moduleFile = {
                path: "/a/b/moduleFile.ts",
                content: "export function bar() { };"
            };
            const file1 = {
                path: "/a/b/file1.ts",
                content: 'import * as T from "./moduleFile"; T.bar();'
            };
            const configFile = {
                path: "/a/b/tsconfig.json",
                content: `{}`
            };
            const host = ts.tscWatch.createWatchedSystem([moduleFile, file1, configFile, ts.tscWatch.libFile]);
            const watch = ts.tscWatch.createWatchOfConfigFile(configFile.path, host);
            ts.tscWatch.checkOutputErrorsInitial(host, ts.emptyArray);
            const moduleFileOldPath = moduleFile.path;
            const moduleFileNewPath = "/a/b/moduleFile1.ts";
            moduleFile.path = moduleFileNewPath;
            host.reloadFS([moduleFile, file1, configFile, ts.tscWatch.libFile]);
            host.runQueuedTimeoutCallbacks();
            ts.tscWatch.checkOutputErrorsIncremental(host, [
                ts.tscWatch.getDiagnosticModuleNotFoundOfFile(watch(), file1, "./moduleFile")
            ]);
            moduleFile.path = moduleFileOldPath;
            host.reloadFS([moduleFile, file1, configFile, ts.tscWatch.libFile]);
            host.runQueuedTimeoutCallbacks();
            ts.tscWatch.checkOutputErrorsIncremental(host, ts.emptyArray);
        });
        it("types should load from config file path if config exists", () => {
            const f1 = {
                path: "/a/b/app.ts",
                content: "let x = 1"
            };
            const config = {
                path: "/a/b/tsconfig.json",
                content: JSON.stringify({ compilerOptions: { types: ["node"], typeRoots: [] } })
            };
            const node = {
                path: "/a/b/node_modules/@types/node/index.d.ts",
                content: "declare var process: any"
            };
            const cwd = {
                path: "/a/c"
            };
            const host = ts.tscWatch.createWatchedSystem([f1, config, node, cwd], { currentDirectory: cwd.path });
            const watch = ts.tscWatch.createWatchOfConfigFile(config.path, host);
            ts.tscWatch.checkProgramActualFiles(watch(), [f1.path, node.path]);
        });
        it("add the missing module file for inferred project: should remove the `module not found` error", () => {
            const moduleFile = {
                path: "/a/b/moduleFile.ts",
                content: "export function bar() { };"
            };
            const file1 = {
                path: "/a/b/file1.ts",
                content: 'import * as T from "./moduleFile"; T.bar();'
            };
            const host = ts.tscWatch.createWatchedSystem([file1, ts.tscWatch.libFile]);
            const watch = ts.tscWatch.createWatchOfFilesAndCompilerOptions([file1.path], host);
            ts.tscWatch.checkOutputErrorsInitial(host, [
                ts.tscWatch.getDiagnosticModuleNotFoundOfFile(watch(), file1, "./moduleFile")
            ]);
            host.reloadFS([file1, moduleFile, ts.tscWatch.libFile]);
            host.runQueuedTimeoutCallbacks();
            ts.tscWatch.checkOutputErrorsIncremental(host, ts.emptyArray);
        });
        it("Configure file diagnostics events are generated when the config file has errors", () => {
            const file = {
                path: "/a/b/app.ts",
                content: "let x = 10"
            };
            const configFile = {
                path: "/a/b/tsconfig.json",
                content: `{
                        "compilerOptions": {
                            "foo": "bar",
                            "allowJS": true
                        }
                    }`
            };
            const host = ts.tscWatch.createWatchedSystem([file, configFile, ts.tscWatch.libFile]);
            const watch = ts.tscWatch.createWatchOfConfigFile(configFile.path, host);
            ts.tscWatch.checkOutputErrorsInitial(host, [
                ts.tscWatch.getUnknownCompilerOption(watch(), configFile, "foo"),
                ts.tscWatch.getUnknownDidYouMeanCompilerOption(watch(), configFile, "allowJS", "allowJs")
            ]);
        });
        it("If config file doesnt have errors, they are not reported", () => {
            const file = {
                path: "/a/b/app.ts",
                content: "let x = 10"
            };
            const configFile = {
                path: "/a/b/tsconfig.json",
                content: `{
                        "compilerOptions": {}
                    }`
            };
            const host = ts.tscWatch.createWatchedSystem([file, configFile, ts.tscWatch.libFile]);
            ts.tscWatch.createWatchOfConfigFile(configFile.path, host);
            ts.tscWatch.checkOutputErrorsInitial(host, ts.emptyArray);
        });
        it("Reports errors when the config file changes", () => {
            const file = {
                path: "/a/b/app.ts",
                content: "let x = 10"
            };
            const configFile = {
                path: "/a/b/tsconfig.json",
                content: `{
                        "compilerOptions": {}
                    }`
            };
            const host = ts.tscWatch.createWatchedSystem([file, configFile, ts.tscWatch.libFile]);
            const watch = ts.tscWatch.createWatchOfConfigFile(configFile.path, host);
            ts.tscWatch.checkOutputErrorsInitial(host, ts.emptyArray);
            configFile.content = `{
                    "compilerOptions": {
                        "haha": 123
                    }
                }`;
            host.reloadFS([file, configFile, ts.tscWatch.libFile]);
            host.runQueuedTimeoutCallbacks();
            ts.tscWatch.checkOutputErrorsIncremental(host, [
                ts.tscWatch.getUnknownCompilerOption(watch(), configFile, "haha")
            ]);
            configFile.content = `{
                    "compilerOptions": {}
                }`;
            host.reloadFS([file, configFile, ts.tscWatch.libFile]);
            host.runQueuedTimeoutCallbacks();
            ts.tscWatch.checkOutputErrorsIncremental(host, ts.emptyArray);
        });
        it("non-existing directories listed in config file input array should be tolerated without crashing the server", () => {
            const configFile = {
                path: "/a/b/tsconfig.json",
                content: `{
                        "compilerOptions": {},
                        "include": ["app/*", "test/**/*", "something"]
                    }`
            };
            const file1 = {
                path: "/a/b/file1.ts",
                content: "let t = 10;"
            };
            const host = ts.tscWatch.createWatchedSystem([file1, configFile, ts.tscWatch.libFile]);
            const watch = ts.tscWatch.createWatchOfConfigFile(configFile.path, host);
            ts.tscWatch.checkProgramActualFiles(watch(), ts.emptyArray);
            ts.tscWatch.checkOutputErrorsInitial(host, [
                "error TS18003: No inputs were found in config file '/a/b/tsconfig.json'. Specified 'include' paths were '[\"app/*\",\"test/**/*\",\"something\"]' and 'exclude' paths were '[]'.\n"
            ]);
        });
        it("non-existing directories listed in config file input array should be able to handle @types if input file list is empty", () => {
            const f = {
                path: "/a/app.ts",
                content: "let x = 1"
            };
            const config = {
                path: "/a/tsconfig.json",
                content: JSON.stringify({
                    compiler: {},
                    files: []
                })
            };
            const t1 = {
                path: "/a/node_modules/@types/typings/index.d.ts",
                content: `export * from "./lib"`
            };
            const t2 = {
                path: "/a/node_modules/@types/typings/lib.d.ts",
                content: `export const x: number`
            };
            const host = ts.tscWatch.createWatchedSystem([f, config, t1, t2], { currentDirectory: ts.getDirectoryPath(f.path) });
            const watch = ts.tscWatch.createWatchOfConfigFile(config.path, host);
            ts.tscWatch.checkProgramActualFiles(watch(), ts.emptyArray);
            ts.tscWatch.checkOutputErrorsInitial(host, [
                "tsconfig.json(1,24): error TS18002: The 'files' list in config file '/a/tsconfig.json' is empty.\n"
            ]);
        });
        it("should support files without extensions", () => {
            const f = {
                path: "/a/compile",
                content: "let x = 1"
            };
            const host = ts.tscWatch.createWatchedSystem([f, ts.tscWatch.libFile]);
            const watch = ts.tscWatch.createWatchOfFilesAndCompilerOptions([f.path], host, { allowNonTsExtensions: true });
            ts.tscWatch.checkProgramActualFiles(watch(), [f.path, ts.tscWatch.libFile.path]);
        });
        it("Options Diagnostic locations reported correctly with changes in configFile contents when options change", () => {
            const file = {
                path: "/a/b/app.ts",
                content: "let x = 10"
            };
            const configFileContentBeforeComment = `{`;
            const configFileContentComment = `
                    // comment
                    // More comment`;
            const configFileContentAfterComment = `
                    "compilerOptions": {
                        "inlineSourceMap": true,
                        "mapRoot": "./"
                    }
                }`;
            const configFileContentWithComment = configFileContentBeforeComment + configFileContentComment + configFileContentAfterComment;
            const configFileContentWithoutCommentLine = configFileContentBeforeComment + configFileContentAfterComment;
            const configFile = {
                path: "/a/b/tsconfig.json",
                content: configFileContentWithComment
            };
            const files = [file, ts.tscWatch.libFile, configFile];
            const host = ts.tscWatch.createWatchedSystem(files);
            const watch = ts.tscWatch.createWatchOfConfigFile(configFile.path, host);
            const errors = () => [
                ts.tscWatch.getDiagnosticOfFile((watch().getCompilerOptions().configFile!), configFile.content.indexOf('"inlineSourceMap"'), '"inlineSourceMap"'.length, ts.Diagnostics.Option_0_cannot_be_specified_with_option_1, "mapRoot", "inlineSourceMap"),
                ts.tscWatch.getDiagnosticOfFile((watch().getCompilerOptions().configFile!), configFile.content.indexOf('"mapRoot"'), '"mapRoot"'.length, ts.Diagnostics.Option_0_cannot_be_specified_with_option_1, "mapRoot", "inlineSourceMap"),
                ts.tscWatch.getDiagnosticOfFile((watch().getCompilerOptions().configFile!), configFile.content.indexOf('"mapRoot"'), '"mapRoot"'.length, ts.Diagnostics.Option_0_cannot_be_specified_without_specifying_option_1_or_option_2, "mapRoot", "sourceMap", "declarationMap")
            ];
            const intialErrors = errors();
            ts.tscWatch.checkOutputErrorsInitial(host, intialErrors);
            configFile.content = configFileContentWithoutCommentLine;
            host.reloadFS(files);
            host.runQueuedTimeoutCallbacks();
            const nowErrors = errors();
            ts.tscWatch.checkOutputErrorsIncremental(host, nowErrors);
            assert.equal(nowErrors[0].start, intialErrors[0].start! - configFileContentComment.length);
            assert.equal(nowErrors[1].start, intialErrors[1].start! - configFileContentComment.length);
        });
        describe("should not trigger should not trigger recompilation because of program emit", () => {
            function verifyWithOptions(options: ts.CompilerOptions, outputFiles: readonly string[]) {
                const file1: ts.tscWatch.File = {
                    path: `${ts.tscWatch.projectRoot}/file1.ts`,
                    content: "export const c = 30;"
                };
                const file2: ts.tscWatch.File = {
                    path: `${ts.tscWatch.projectRoot}/src/file2.ts`,
                    content: `import {c} from "file1"; export const d = 30;`
                };
                const tsconfig: ts.tscWatch.File = {
                    path: `${ts.tscWatch.projectRoot}/tsconfig.json`,
                    content: ts.generateTSConfig(options, ts.emptyArray, "\n")
                };
                const host = ts.tscWatch.createWatchedSystem([file1, file2, ts.tscWatch.libFile, tsconfig], { currentDirectory: ts.tscWatch.projectRoot });
                const watch = ts.tscWatch.createWatchOfConfigFile(tsconfig.path, host, /*optionsToExtend*/ undefined, /*watchOptionsToExtend*/ undefined, /*maxNumberOfFilesToIterateForInvalidation*/ 1);
                ts.tscWatch.checkProgramActualFiles(watch(), [file1.path, file2.path, ts.tscWatch.libFile.path]);
                outputFiles.forEach(f => host.fileExists(f));
                // This should be 0
                host.checkTimeoutQueueLengthAndRun(0);
            }
            it("without outDir or outFile is specified", () => {
                verifyWithOptions({ module: ts.ModuleKind.AMD }, ["file1.js", "src/file2.js"]);
            });
            it("with outFile", () => {
                verifyWithOptions({ module: ts.ModuleKind.AMD, outFile: "build/outFile.js" }, ["build/outFile.js"]);
            });
            it("when outDir is specified", () => {
                verifyWithOptions({ module: ts.ModuleKind.AMD, outDir: "build" }, ["build/file1.js", "build/src/file2.js"]);
            });
            it("when outDir and declarationDir is specified", () => {
                verifyWithOptions({ module: ts.ModuleKind.AMD, outDir: "build", declaration: true, declarationDir: "decls" }, ["build/file1.js", "build/src/file2.js", "decls/file1.d.ts", "decls/src/file2.d.ts"]);
            });
            it("declarationDir is specified", () => {
                verifyWithOptions({ module: ts.ModuleKind.AMD, declaration: true, declarationDir: "decls" }, ["file1.js", "src/file2.js", "decls/file1.d.ts", "decls/src/file2.d.ts"]);
            });
        });
        it("shouldnt report error about unused function incorrectly when file changes from global to module", () => {
            const getFileContent = (asModule: boolean) => `
                    function one() {}
                    ${asModule ? "export " : ""}function two() {
                      return function three() {
                        one();
                      }
                    }`;
            const file: ts.tscWatch.File = {
                path: "/a/b/file.ts",
                content: getFileContent(/*asModule*/ false)
            };
            const files = [file, ts.tscWatch.libFile];
            const host = ts.tscWatch.createWatchedSystem(files);
            const watch = ts.tscWatch.createWatchOfFilesAndCompilerOptions([file.path], host, {
                noUnusedLocals: true
            });
            ts.tscWatch.checkProgramActualFiles(watch(), files.map(file => file.path));
            ts.tscWatch.checkOutputErrorsInitial(host, []);
            file.content = getFileContent(/*asModule*/ true);
            host.reloadFS(files);
            host.runQueuedTimeoutCallbacks();
            ts.tscWatch.checkProgramActualFiles(watch(), files.map(file => file.path));
            ts.tscWatch.checkOutputErrorsIncremental(host, ts.emptyArray);
        });
        it("watched files when file is deleted and new file is added as part of change", () => {
            const projectLocation = "/home/username/project";
            const file: ts.tscWatch.File = {
                path: `${projectLocation}/src/file1.ts`,
                content: "var a = 10;"
            };
            const configFile: ts.tscWatch.File = {
                path: `${projectLocation}/tsconfig.json`,
                content: "{}"
            };
            const files = [file, ts.tscWatch.libFile, configFile];
            const host = ts.tscWatch.createWatchedSystem(files);
            const watch = ts.tscWatch.createWatchOfConfigFile(configFile.path, host);
            verifyProgram();
            file.path = file.path.replace("file1", "file2");
            host.reloadFS(files);
            host.runQueuedTimeoutCallbacks();
            verifyProgram();
            function verifyProgram() {
                ts.tscWatch.checkProgramActualFiles(watch(), ts.mapDefined(files, f => f === configFile ? undefined : f.path));
                ts.tscWatch.checkWatchedDirectories(host, [], /*recursive*/ false);
                ts.tscWatch.checkWatchedDirectories(host, [projectLocation, `${projectLocation}/node_modules/@types`], /*recursive*/ true);
                ts.tscWatch.checkWatchedFiles(host, files.map(f => f.path));
            }
        });
        it("updates errors correctly when declaration emit is disabled in compiler options", () => {
            const aFile: ts.tscWatch.File = {
                path: `${ts.tscWatch.projectRoot}/a.ts`,
                content: `import test from './b';
test(4, 5);`
            };
            const bFileContent = `function test(x: number, y: number) {
    return x + y / 5;
}
export default test;`;
            const bFile: ts.tscWatch.File = {
                path: `${ts.tscWatch.projectRoot}/b.ts`,
                content: bFileContent
            };
            const tsconfigFile: ts.tscWatch.File = {
                path: `${ts.tscWatch.projectRoot}/tsconfig.json`,
                content: JSON.stringify({
                    compilerOptions: {
                        module: "commonjs",
                        noEmit: true,
                        strict: true,
                    }
                })
            };
            const files = [aFile, bFile, ts.tscWatch.libFile, tsconfigFile];
            const host = ts.tscWatch.createWatchedSystem(files, { currentDirectory: ts.tscWatch.projectRoot });
            const watch = ts.tscWatch.createWatchOfConfigFile("tsconfig.json", host);
            ts.tscWatch.checkOutputErrorsInitial(host, ts.emptyArray);
            changeParameterType("x", "string", [
                ts.tscWatch.getDiagnosticOfFileFromProgram(watch(), aFile.path, aFile.content.indexOf("4"), 1, ts.Diagnostics.Argument_of_type_0_is_not_assignable_to_parameter_of_type_1, "4", "string")
            ]);
            changeParameterType("y", "string", [
                ts.tscWatch.getDiagnosticOfFileFromProgram(watch(), aFile.path, aFile.content.indexOf("5"), 1, ts.Diagnostics.Argument_of_type_0_is_not_assignable_to_parameter_of_type_1, "5", "string"),
                ts.tscWatch.getDiagnosticOfFileFromProgram(watch(), bFile.path, bFile.content.indexOf("y /"), 1, ts.Diagnostics.The_left_hand_side_of_an_arithmetic_operation_must_be_of_type_any_number_bigint_or_an_enum_type)
            ]);
            function changeParameterType(parameterName: string, toType: string, expectedErrors: readonly ts.Diagnostic[]) {
                const newContent = bFileContent.replace(new RegExp(`${parameterName}\: [a-z]*`), `${parameterName}: ${toType}`);
                verifyErrorsWithBFileContents(newContent, expectedErrors);
                verifyErrorsWithBFileContents(bFileContent, ts.emptyArray);
            }
            function verifyErrorsWithBFileContents(content: string, expectedErrors: readonly ts.Diagnostic[]) {
                host.writeFile(bFile.path, content);
                host.runQueuedTimeoutCallbacks();
                ts.tscWatch.checkOutputErrorsIncremental(host, expectedErrors);
            }
        });
        it("updates errors when strictNullChecks changes", () => {
            const aFile: ts.tscWatch.File = {
                path: `${ts.tscWatch.projectRoot}/a.ts`,
                content: `declare function foo(): null | { hello: any };
foo().hello`
            };
            const config: ts.tscWatch.File = {
                path: `${ts.tscWatch.projectRoot}/tsconfig.json`,
                content: JSON.stringify({ compilerOptions: {} })
            };
            const files = [aFile, config, ts.tscWatch.libFile];
            const host = ts.tscWatch.createWatchedSystem(files, { currentDirectory: ts.tscWatch.projectRoot });
            const watch = ts.tscWatch.createWatchOfConfigFile("tsconfig.json", host);
            ts.tscWatch.checkProgramActualFiles(watch(), [aFile.path, ts.tscWatch.libFile.path]);
            ts.tscWatch.checkOutputErrorsInitial(host, ts.emptyArray);
            const modifiedTimeOfAJs = host.getModifiedTime(`${ts.tscWatch.projectRoot}/a.js`);
            host.writeFile(config.path, JSON.stringify({ compilerOptions: { strictNullChecks: true } }));
            host.runQueuedTimeoutCallbacks();
            const expectedStrictNullErrors = [
                ts.tscWatch.getDiagnosticOfFileFromProgram(watch(), aFile.path, aFile.content.lastIndexOf("foo()"), 5, ts.Diagnostics.Object_is_possibly_null)
            ];
            ts.tscWatch.checkOutputErrorsIncremental(host, expectedStrictNullErrors);
            // File a need not be rewritten
            assert.equal(host.getModifiedTime(`${ts.tscWatch.projectRoot}/a.js`), modifiedTimeOfAJs);
            host.writeFile(config.path, JSON.stringify({ compilerOptions: { strict: true, alwaysStrict: false } })); // Avoid changing 'alwaysStrict' or must re-bind
            host.runQueuedTimeoutCallbacks();
            ts.tscWatch.checkOutputErrorsIncremental(host, expectedStrictNullErrors);
            // File a need not be rewritten
            assert.equal(host.getModifiedTime(`${ts.tscWatch.projectRoot}/a.js`), modifiedTimeOfAJs);
            host.writeFile(config.path, JSON.stringify({ compilerOptions: {} }));
            host.runQueuedTimeoutCallbacks();
            ts.tscWatch.checkOutputErrorsIncremental(host, ts.emptyArray);
            // File a need not be rewritten
            assert.equal(host.getModifiedTime(`${ts.tscWatch.projectRoot}/a.js`), modifiedTimeOfAJs);
        });
        it("updates errors when ambient modules of program changes", () => {
            const aFile: ts.tscWatch.File = {
                path: `${ts.tscWatch.projectRoot}/a.ts`,
                content: `declare module 'a' {
  type foo = number;
}`
            };
            const config: ts.tscWatch.File = {
                path: `${ts.tscWatch.projectRoot}/tsconfig.json`,
                content: "{}"
            };
            const files = [aFile, config, ts.tscWatch.libFile];
            const host = ts.tscWatch.createWatchedSystem(files, { currentDirectory: ts.tscWatch.projectRoot });
            const watch = ts.tscWatch.createWatchOfConfigFile("tsconfig.json", host);
            ts.tscWatch.checkProgramActualFiles(watch(), [aFile.path, ts.tscWatch.libFile.path]);
            ts.tscWatch.checkOutputErrorsInitial(host, ts.emptyArray);
            // Create bts with same file contents
            const bTsPath = `${ts.tscWatch.projectRoot}/b.ts`;
            host.writeFile(bTsPath, aFile.content);
            host.runQueuedTimeoutCallbacks();
            ts.tscWatch.checkProgramActualFiles(watch(), [aFile.path, bTsPath, ts.tscWatch.libFile.path]);
            ts.tscWatch.checkOutputErrorsIncremental(host, [
                "a.ts(2,8): error TS2300: Duplicate identifier 'foo'.\n",
                "b.ts(2,8): error TS2300: Duplicate identifier 'foo'.\n"
            ]);
            // Delete bTs
            host.deleteFile(bTsPath);
            host.runQueuedTimeoutCallbacks();
            ts.tscWatch.checkProgramActualFiles(watch(), [aFile.path, ts.tscWatch.libFile.path]);
            ts.tscWatch.checkOutputErrorsIncremental(host, ts.emptyArray);
        });
        describe("updates errors in lib file", () => {
            const field = "fullscreen";
            const fieldWithoutReadonly = `interface Document {
    ${field}: boolean;
}`;
            const libFileWithDocument: ts.tscWatch.File = {
                path: ts.tscWatch.libFile.path,
                content: `${ts.tscWatch.libFile.content}
interface Document {
    readonly ${field}: boolean;
}`
            };
            function getDiagnostic(program: ts.Program, file: ts.tscWatch.File) {
                return ts.tscWatch.getDiagnosticOfFileFromProgram(program, file.path, file.content.indexOf(field), field.length, ts.Diagnostics.All_declarations_of_0_must_have_identical_modifiers, field);
            }
            function verifyLibFileErrorsWith(aFile: ts.tscWatch.File) {
                const files = [aFile, libFileWithDocument];
                function verifyLibErrors(options: ts.CompilerOptions) {
                    const host = ts.tscWatch.createWatchedSystem(files, { currentDirectory: ts.tscWatch.projectRoot });
                    const watch = ts.tscWatch.createWatchOfFilesAndCompilerOptions([aFile.path], host, options);
                    ts.tscWatch.checkProgramActualFiles(watch(), [aFile.path, ts.tscWatch.libFile.path]);
                    ts.tscWatch.checkOutputErrorsInitial(host, getErrors());
                    host.writeFile(aFile.path, aFile.content.replace(fieldWithoutReadonly, "var x: string;"));
                    host.runQueuedTimeoutCallbacks();
                    ts.tscWatch.checkProgramActualFiles(watch(), [aFile.path, ts.tscWatch.libFile.path]);
                    ts.tscWatch.checkOutputErrorsIncremental(host, ts.emptyArray);
                    host.writeFile(aFile.path, aFile.content);
                    host.runQueuedTimeoutCallbacks();
                    ts.tscWatch.checkProgramActualFiles(watch(), [aFile.path, ts.tscWatch.libFile.path]);
                    ts.tscWatch.checkOutputErrorsIncremental(host, getErrors());
                    function getErrors() {
                        return [
                            ...(options.skipLibCheck || options.skipDefaultLibCheck ? [] : [getDiagnostic(watch(), libFileWithDocument)]),
                            getDiagnostic(watch(), aFile)
                        ];
                    }
                }
                it("with default options", () => {
                    verifyLibErrors({});
                });
                it("with skipLibCheck", () => {
                    verifyLibErrors({ skipLibCheck: true });
                });
                it("with skipDefaultLibCheck", () => {
                    verifyLibErrors({ skipDefaultLibCheck: true });
                });
            }
            describe("when non module file changes", () => {
                const aFile: ts.tscWatch.File = {
                    path: `${ts.tscWatch.projectRoot}/a.ts`,
                    content: `${fieldWithoutReadonly}
var y: number;`
                };
                verifyLibFileErrorsWith(aFile);
            });
            describe("when module file with global definitions changes", () => {
                const aFile: ts.tscWatch.File = {
                    path: `${ts.tscWatch.projectRoot}/a.ts`,
                    content: `export {}
declare global {
${fieldWithoutReadonly}
var y: number;
}`
                };
                verifyLibFileErrorsWith(aFile);
            });
        });
        it("when skipLibCheck and skipDefaultLibCheck changes", () => {
            const field = "fullscreen";
            const aFile: ts.tscWatch.File = {
                path: `${ts.tscWatch.projectRoot}/a.ts`,
                content: `interface Document {
    ${field}: boolean;
}`
            };
            const bFile: ts.tscWatch.File = {
                path: `${ts.tscWatch.projectRoot}/b.d.ts`,
                content: `interface Document {
    ${field}: boolean;
}`
            };
            const libFileWithDocument: ts.tscWatch.File = {
                path: ts.tscWatch.libFile.path,
                content: `${ts.tscWatch.libFile.content}
interface Document {
    readonly ${field}: boolean;
}`
            };
            const configFile: ts.tscWatch.File = {
                path: `${ts.tscWatch.projectRoot}/tsconfig.json`,
                content: "{}"
            };
            const files = [aFile, bFile, configFile, libFileWithDocument];
            const host = ts.tscWatch.createWatchedSystem(files, { currentDirectory: ts.tscWatch.projectRoot });
            const watch = ts.tscWatch.createWatchOfConfigFile("tsconfig.json", host);
            verifyProgramFiles();
            ts.tscWatch.checkOutputErrorsInitial(host, [
                getDiagnostic(libFileWithDocument),
                getDiagnostic(aFile),
                getDiagnostic(bFile)
            ]);
            verifyConfigChange({ skipLibCheck: true }, [aFile]);
            verifyConfigChange({ skipDefaultLibCheck: true }, [aFile, bFile]);
            verifyConfigChange({}, [libFileWithDocument, aFile, bFile]);
            verifyConfigChange({ skipDefaultLibCheck: true }, [aFile, bFile]);
            verifyConfigChange({ skipLibCheck: true }, [aFile]);
            verifyConfigChange({}, [libFileWithDocument, aFile, bFile]);
            function verifyConfigChange(compilerOptions: ts.CompilerOptions, errorInFiles: readonly ts.tscWatch.File[]) {
                host.writeFile(configFile.path, JSON.stringify({ compilerOptions }));
                host.runQueuedTimeoutCallbacks();
                verifyProgramFiles();
                ts.tscWatch.checkOutputErrorsIncremental(host, errorInFiles.map(getDiagnostic));
            }
            function getDiagnostic(file: ts.tscWatch.File) {
                return ts.tscWatch.getDiagnosticOfFileFromProgram(watch(), file.path, file.content.indexOf(field), field.length, ts.Diagnostics.All_declarations_of_0_must_have_identical_modifiers, field);
            }
            function verifyProgramFiles() {
                ts.tscWatch.checkProgramActualFiles(watch(), [aFile.path, bFile.path, ts.tscWatch.libFile.path]);
            }
        });
        it("reports errors correctly with isolatedModules", () => {
            const aFile: ts.tscWatch.File = {
                path: `${ts.tscWatch.projectRoot}/a.ts`,
                content: `export const a: string = "";`
            };
            const bFile: ts.tscWatch.File = {
                path: `${ts.tscWatch.projectRoot}/b.ts`,
                content: `import { a } from "./a";
const b: string = a;`
            };
            const configFile: ts.tscWatch.File = {
                path: `${ts.tscWatch.projectRoot}/tsconfig.json`,
                content: JSON.stringify({
                    compilerOptions: {
                        isolatedModules: true
                    }
                })
            };
            const files = [aFile, bFile, ts.tscWatch.libFile, configFile];
            const host = ts.tscWatch.createWatchedSystem(files, { currentDirectory: ts.tscWatch.projectRoot });
            const watch = ts.tscWatch.createWatchOfConfigFile("tsconfig.json", host);
            verifyProgramFiles();
            ts.tscWatch.checkOutputErrorsInitial(host, ts.emptyArray);
            assert.equal(host.readFile(`${ts.tscWatch.projectRoot}/a.js`), `"use strict";
exports.__esModule = true;
exports.a = "";
`, "Contents of a.js");
            assert.equal(host.readFile(`${ts.tscWatch.projectRoot}/b.js`), `"use strict";
exports.__esModule = true;
var a_1 = require("./a");
var b = a_1.a;
`, "Contents of b.js");
            const modifiedTime = host.getModifiedTime(`${ts.tscWatch.projectRoot}/b.js`);
            host.writeFile(aFile.path, `export const a: number = 1`);
            host.runQueuedTimeoutCallbacks();
            verifyProgramFiles();
            ts.tscWatch.checkOutputErrorsIncremental(host, [
                ts.tscWatch.getDiagnosticOfFileFromProgram(watch(), bFile.path, bFile.content.indexOf("b"), 1, ts.Diagnostics.Type_0_is_not_assignable_to_type_1, "number", "string")
            ]);
            assert.equal(host.readFile(`${ts.tscWatch.projectRoot}/a.js`), `"use strict";
exports.__esModule = true;
exports.a = 1;
`, "Contents of a.js");
            assert.equal(host.getModifiedTime(`${ts.tscWatch.projectRoot}/b.js`), modifiedTime, "Timestamp of b.js");
            function verifyProgramFiles() {
                ts.tscWatch.checkProgramActualFiles(watch(), [aFile.path, bFile.path, ts.tscWatch.libFile.path]);
            }
        });
        it("reports errors correctly with file not in rootDir", () => {
            const aFile: ts.tscWatch.File = {
                path: `${ts.tscWatch.projectRoot}/a.ts`,
                content: `import { x } from "../b";`
            };
            const bFile: ts.tscWatch.File = {
                path: `/user/username/projects/b.ts`,
                content: `export const x = 10;`
            };
            const configFile: ts.tscWatch.File = {
                path: `${ts.tscWatch.projectRoot}/tsconfig.json`,
                content: JSON.stringify({
                    compilerOptions: {
                        rootDir: ".",
                        outDir: "lib"
                    }
                })
            };
            const files = [aFile, bFile, ts.tscWatch.libFile, configFile];
            const host = ts.tscWatch.createWatchedSystem(files, { currentDirectory: ts.tscWatch.projectRoot });
            const watch = ts.tscWatch.createWatchOfConfigFile("tsconfig.json", host);
            ts.tscWatch.checkOutputErrorsInitial(host, [
                ts.tscWatch.getDiagnosticOfFileFromProgram(watch(), aFile.path, aFile.content.indexOf(`"../b"`), `"../b"`.length, ts.Diagnostics.File_0_is_not_under_rootDir_1_rootDir_is_expected_to_contain_all_source_files, bFile.path, ts.tscWatch.projectRoot)
            ]);
            const aContent = `

${aFile.content}`;
            host.writeFile(aFile.path, aContent);
            host.runQueuedTimeoutCallbacks();
            ts.tscWatch.checkOutputErrorsIncremental(host, [
                ts.tscWatch.getDiagnosticOfFileFromProgram(watch(), aFile.path, aContent.indexOf(`"../b"`), `"../b"`.length, ts.Diagnostics.File_0_is_not_under_rootDir_1_rootDir_is_expected_to_contain_all_source_files, bFile.path, ts.tscWatch.projectRoot)
            ]);
        });
    });
}
