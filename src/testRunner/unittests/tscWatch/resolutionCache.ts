namespace ts.tscWatch {
    describe("unittests:: tsc-watch:: resolutionCache:: tsc-watch module resolution caching", () => {
        it("works", () => {
            const root = {
                path: "/a/d/f0.ts",
                content: `import {x} from "f1"`
            };
            const imported = {
                path: "/a/f1.ts",
                content: `foo()`
            };
            const files = [root, imported, ts.tscWatch.libFile];
            const host = ts.tscWatch.createWatchedSystem(files);
            const watch = ts.tscWatch.createWatchOfFilesAndCompilerOptions([root.path], host, { module: ts.ModuleKind.AMD });
            const f1IsNotModule = ts.tscWatch.getDiagnosticOfFileFromProgram(watch(), root.path, root.content.indexOf('"f1"'), '"f1"'.length, ts.Diagnostics.File_0_is_not_a_module, imported.path);
            const cannotFindFoo = ts.tscWatch.getDiagnosticOfFileFromProgram(watch(), imported.path, imported.content.indexOf("foo"), "foo".length, ts.Diagnostics.Cannot_find_name_0, "foo");
            // ensure that imported file was found
            ts.tscWatch.checkOutputErrorsInitial(host, [f1IsNotModule, cannotFindFoo]);
            const originalFileExists = host.fileExists;
            {
                const newContent = `import {x} from "f1"
                var x: string = 1;`;
                root.content = newContent;
                host.reloadFS(files);
                // patch fileExists to make sure that disk is not touched
                host.fileExists = ts.notImplemented;
                // trigger synchronization to make sure that import will be fetched from the cache
                host.runQueuedTimeoutCallbacks();
                // ensure file has correct number of errors after edit
                ts.tscWatch.checkOutputErrorsIncremental(host, [
                    f1IsNotModule,
                    ts.tscWatch.getDiagnosticOfFileFromProgram(watch(), root.path, newContent.indexOf("var x") + "var ".length, "x".length, ts.Diagnostics.Type_0_is_not_assignable_to_type_1, 1, "string"),
                    cannotFindFoo
                ]);
            }
            {
                let fileExistsIsCalled = false;
                host.fileExists = (fileName): boolean => {
                    if (fileName === "lib.d.ts") {
                        return false;
                    }
                    fileExistsIsCalled = true;
                    assert.isTrue(fileName.indexOf("/f2.") !== -1);
                    return originalFileExists.call(host, fileName);
                };
                root.content = `import {x} from "f2"`;
                host.reloadFS(files);
                // trigger synchronization to make sure that system will try to find 'f2' module on disk
                host.runQueuedTimeoutCallbacks();
                // ensure file has correct number of errors after edit
                ts.tscWatch.checkOutputErrorsIncremental(host, [
                    ts.tscWatch.getDiagnosticModuleNotFoundOfFile(watch(), root, "f2")
                ]);
                assert.isTrue(fileExistsIsCalled);
            }
            {
                let fileExistsCalled = false;
                host.fileExists = (fileName): boolean => {
                    if (fileName === "lib.d.ts") {
                        return false;
                    }
                    fileExistsCalled = true;
                    assert.isTrue(fileName.indexOf("/f1.") !== -1);
                    return originalFileExists.call(host, fileName);
                };
                const newContent = `import {x} from "f1"`;
                root.content = newContent;
                host.reloadFS(files);
                host.runQueuedTimeoutCallbacks();
                ts.tscWatch.checkOutputErrorsIncremental(host, [f1IsNotModule, cannotFindFoo]);
                assert.isTrue(fileExistsCalled);
            }
        });
        it("loads missing files from disk", () => {
            const root = {
                path: `/a/foo.ts`,
                content: `import {x} from "bar"`
            };
            const imported = {
                path: `/a/bar.d.ts`,
                content: `export const y = 1;`
            };
            const files = [root, ts.tscWatch.libFile];
            const host = ts.tscWatch.createWatchedSystem(files);
            const originalFileExists = host.fileExists;
            let fileExistsCalledForBar = false;
            host.fileExists = fileName => {
                if (fileName === "lib.d.ts") {
                    return false;
                }
                if (!fileExistsCalledForBar) {
                    fileExistsCalledForBar = fileName.indexOf("/bar.") !== -1;
                }
                return originalFileExists.call(host, fileName);
            };
            const watch = ts.tscWatch.createWatchOfFilesAndCompilerOptions([root.path], host, { module: ts.ModuleKind.AMD });
            assert.isTrue(fileExistsCalledForBar, "'fileExists' should be called");
            ts.tscWatch.checkOutputErrorsInitial(host, [
                ts.tscWatch.getDiagnosticModuleNotFoundOfFile(watch(), root, "bar")
            ]);
            fileExistsCalledForBar = false;
            root.content = `import {y} from "bar"`;
            host.reloadFS(files.concat(imported));
            host.runQueuedTimeoutCallbacks();
            ts.tscWatch.checkOutputErrorsIncremental(host, ts.emptyArray);
            assert.isTrue(fileExistsCalledForBar, "'fileExists' should be called.");
        });
        it("should compile correctly when resolved module goes missing and then comes back (module is not part of the root)", () => {
            const root = {
                path: `/a/foo.ts`,
                content: `import {x} from "bar"`
            };
            const imported = {
                path: `/a/bar.d.ts`,
                content: `export const y = 1;export const x = 10;`
            };
            const files = [root, ts.tscWatch.libFile];
            const filesWithImported = files.concat(imported);
            const host = ts.tscWatch.createWatchedSystem(filesWithImported);
            const originalFileExists = host.fileExists;
            let fileExistsCalledForBar = false;
            host.fileExists = fileName => {
                if (fileName === "lib.d.ts") {
                    return false;
                }
                if (!fileExistsCalledForBar) {
                    fileExistsCalledForBar = fileName.indexOf("/bar.") !== -1;
                }
                return originalFileExists.call(host, fileName);
            };
            const watch = ts.tscWatch.createWatchOfFilesAndCompilerOptions([root.path], host, { module: ts.ModuleKind.AMD });
            assert.isTrue(fileExistsCalledForBar, "'fileExists' should be called");
            ts.tscWatch.checkOutputErrorsInitial(host, ts.emptyArray);
            fileExistsCalledForBar = false;
            host.reloadFS(files);
            host.runQueuedTimeoutCallbacks();
            assert.isTrue(fileExistsCalledForBar, "'fileExists' should be called.");
            ts.tscWatch.checkOutputErrorsIncremental(host, [
                ts.tscWatch.getDiagnosticModuleNotFoundOfFile(watch(), root, "bar")
            ]);
            fileExistsCalledForBar = false;
            host.reloadFS(filesWithImported);
            host.checkTimeoutQueueLengthAndRun(1);
            ts.tscWatch.checkOutputErrorsIncremental(host, ts.emptyArray);
            assert.isTrue(fileExistsCalledForBar, "'fileExists' should be called.");
        });
        it("works when module resolution changes to ambient module", () => {
            const root = {
                path: "/a/b/foo.ts",
                content: `import * as fs from "fs";`
            };
            const packageJson = {
                path: "/a/b/node_modules/@types/node/package.json",
                content: `
{
  "main": ""
}
`
            };
            const nodeType = {
                path: "/a/b/node_modules/@types/node/index.d.ts",
                content: `
declare module "fs" {
    export interface Stats {
        isFile(): boolean;
    }
}`
            };
            const files = [root, ts.tscWatch.libFile];
            const filesWithNodeType = files.concat(packageJson, nodeType);
            const host = ts.tscWatch.createWatchedSystem(files, { currentDirectory: "/a/b" });
            const watch = ts.tscWatch.createWatchOfFilesAndCompilerOptions([root.path], host, {});
            ts.tscWatch.checkOutputErrorsInitial(host, [
                ts.tscWatch.getDiagnosticModuleNotFoundOfFile(watch(), root, "fs")
            ]);
            host.reloadFS(filesWithNodeType);
            host.runQueuedTimeoutCallbacks();
            ts.tscWatch.checkOutputErrorsIncremental(host, ts.emptyArray);
        });
        it("works when included file with ambient module changes", () => {
            const root = {
                path: "/a/b/foo.ts",
                content: `
import * as fs from "fs";
import * as u from "url";
`
            };
            const file = {
                path: "/a/b/bar.d.ts",
                content: `
declare module "url" {
    export interface Url {
        href?: string;
    }
}
`
            };
            const fileContentWithFS = `
declare module "fs" {
    export interface Stats {
        isFile(): boolean;
    }
}
`;
            const files = [root, file, ts.tscWatch.libFile];
            const host = ts.tscWatch.createWatchedSystem(files, { currentDirectory: "/a/b" });
            const watch = ts.tscWatch.createWatchOfFilesAndCompilerOptions([root.path, file.path], host, {});
            ts.tscWatch.checkOutputErrorsInitial(host, [
                ts.tscWatch.getDiagnosticModuleNotFoundOfFile(watch(), root, "fs")
            ]);
            file.content += fileContentWithFS;
            host.reloadFS(files);
            host.runQueuedTimeoutCallbacks();
            ts.tscWatch.checkOutputErrorsIncremental(host, ts.emptyArray);
        });
        it("works when reusing program with files from external library", () => {
            interface ExpectedFile {
                path: string;
                isExpectedToEmit?: boolean;
                content?: string;
            }
            const configDir = "/a/b/projects/myProject/src/";
            const file1: ts.tscWatch.File = {
                path: configDir + "file1.ts",
                content: 'import module1 = require("module1");\nmodule1("hello");'
            };
            const file2: ts.tscWatch.File = {
                path: configDir + "file2.ts",
                content: 'import module11 = require("module1");\nmodule11("hello");'
            };
            const module1: ts.tscWatch.File = {
                path: "/a/b/projects/myProject/node_modules/module1/index.js",
                content: "module.exports = options => { return options.toString(); }"
            };
            const configFile: ts.tscWatch.File = {
                path: configDir + "tsconfig.json",
                content: JSON.stringify({
                    compilerOptions: {
                        allowJs: true,
                        rootDir: ".",
                        outDir: "../dist",
                        moduleResolution: "node",
                        maxNodeModuleJsDepth: 1
                    }
                })
            };
            const outDirFolder = "/a/b/projects/myProject/dist/";
            const programFiles = [file1, file2, module1, ts.tscWatch.libFile];
            const host = ts.tscWatch.createWatchedSystem(programFiles.concat(configFile), { currentDirectory: "/a/b/projects/myProject/" });
            const watch = ts.tscWatch.createWatchOfConfigFile(configFile.path, host);
            ts.tscWatch.checkProgramActualFiles(watch(), programFiles.map(f => f.path));
            ts.tscWatch.checkOutputErrorsInitial(host, ts.emptyArray);
            const expectedFiles: ExpectedFile[] = [
                createExpectedEmittedFile(file1),
                createExpectedEmittedFile(file2),
                createExpectedToNotEmitFile("index.js"),
                createExpectedToNotEmitFile("src/index.js"),
                createExpectedToNotEmitFile("src/file1.js"),
                createExpectedToNotEmitFile("src/file2.js"),
                createExpectedToNotEmitFile("lib.js"),
                createExpectedToNotEmitFile("lib.d.ts")
            ];
            verifyExpectedFiles(expectedFiles);
            file1.content += "\n;";
            expectedFiles[0].content += ";\n"; // Only emit file1 with this change
            expectedFiles[1].isExpectedToEmit = false;
            host.reloadFS(programFiles.concat(configFile));
            host.runQueuedTimeoutCallbacks();
            ts.tscWatch.checkProgramActualFiles(watch(), programFiles.map(f => f.path));
            ts.tscWatch.checkOutputErrorsIncremental(host, ts.emptyArray);
            verifyExpectedFiles(expectedFiles);
            function verifyExpectedFiles(expectedFiles: ExpectedFile[]) {
                ts.forEach(expectedFiles, f => {
                    assert.equal(!!host.fileExists(f.path), f.isExpectedToEmit, "File " + f.path + " is expected to " + (f.isExpectedToEmit ? "emit" : "not emit"));
                    if (f.isExpectedToEmit) {
                        assert.equal(host.readFile(f.path), f.content, "Expected contents of " + f.path);
                    }
                });
            }
            function createExpectedToNotEmitFile(fileName: string): ExpectedFile {
                return {
                    path: outDirFolder + fileName,
                    isExpectedToEmit: false
                };
            }
            function createExpectedEmittedFile(file: ts.tscWatch.File): ExpectedFile {
                return {
                    path: ts.removeFileExtension(file.path.replace(configDir, outDirFolder)) + ts.Extension.Js,
                    isExpectedToEmit: true,
                    content: '"use strict";\nexports.__esModule = true;\n' + file.content.replace("import", "var") + "\n"
                };
            }
        });
        it("works when renaming node_modules folder that already contains @types folder", () => {
            const file: ts.tscWatch.File = {
                path: `${ts.tscWatch.projectRoot}/a.ts`,
                content: `import * as q from "qqq";`
            };
            const module: ts.tscWatch.File = {
                path: `${ts.tscWatch.projectRoot}/node_modules2/@types/qqq/index.d.ts`,
                content: "export {}"
            };
            const files = [file, module, ts.tscWatch.libFile];
            const host = ts.tscWatch.createWatchedSystem(files, { currentDirectory: ts.tscWatch.projectRoot });
            const watch = ts.tscWatch.createWatchOfFilesAndCompilerOptions([file.path], host);
            ts.tscWatch.checkProgramActualFiles(watch(), [file.path, ts.tscWatch.libFile.path]);
            ts.tscWatch.checkOutputErrorsInitial(host, [ts.tscWatch.getDiagnosticModuleNotFoundOfFile(watch(), file, "qqq")]);
            ts.tscWatch.checkWatchedDirectories(host, ts.emptyArray, /*recursive*/ false);
            ts.tscWatch.checkWatchedDirectories(host, [`${ts.tscWatch.projectRoot}/node_modules`, `${ts.tscWatch.projectRoot}/node_modules/@types`], /*recursive*/ true);
            host.renameFolder(`${ts.tscWatch.projectRoot}/node_modules2`, `${ts.tscWatch.projectRoot}/node_modules`);
            host.runQueuedTimeoutCallbacks();
            ts.tscWatch.checkProgramActualFiles(watch(), [file.path, ts.tscWatch.libFile.path, `${ts.tscWatch.projectRoot}/node_modules/@types/qqq/index.d.ts`]);
            ts.tscWatch.checkOutputErrorsIncremental(host, ts.emptyArray);
        });
        describe("ignores files/folder changes in node_modules that start with '.'", () => {
            const npmCacheFile: ts.tscWatch.File = {
                path: `${ts.tscWatch.projectRoot}/node_modules/.cache/babel-loader/89c02171edab901b9926470ba6d5677e.ts`,
                content: JSON.stringify({ something: 10 })
            };
            const file1: ts.tscWatch.File = {
                path: `${ts.tscWatch.projectRoot}/test.ts`,
                content: `import { x } from "somemodule";`
            };
            const file2: ts.tscWatch.File = {
                path: `${ts.tscWatch.projectRoot}/node_modules/somemodule/index.d.ts`,
                content: `export const x = 10;`
            };
            const files = [ts.tscWatch.libFile, file1, file2];
            const expectedFiles = files.map(f => f.path);
            it("when watching node_modules in inferred project for failed lookup", () => {
                const host = ts.tscWatch.createWatchedSystem(files);
                const watch = ts.tscWatch.createWatchOfFilesAndCompilerOptions([file1.path], host, {}, /*watchOptions*/ undefined, /*maxNumberOfFilesToIterateForInvalidation*/ 1);
                ts.tscWatch.checkProgramActualFiles(watch(), expectedFiles);
                host.checkTimeoutQueueLength(0);
                host.ensureFileOrFolder(npmCacheFile);
                host.checkTimeoutQueueLength(0);
            });
            it("when watching node_modules as part of wild card directories in config project", () => {
                const config: ts.tscWatch.File = {
                    path: `${ts.tscWatch.projectRoot}/tsconfig.json`,
                    content: "{}"
                };
                const host = ts.tscWatch.createWatchedSystem(files.concat(config));
                const watch = ts.tscWatch.createWatchOfConfigFile(config.path, host);
                ts.tscWatch.checkProgramActualFiles(watch(), expectedFiles);
                host.checkTimeoutQueueLength(0);
                host.ensureFileOrFolder(npmCacheFile);
                host.checkTimeoutQueueLength(0);
            });
        });
        it("when types in compiler option are global and installed at later point", () => {
            const projectRoot = "/user/username/projects/myproject";
            const app: ts.tscWatch.File = {
                path: `${projectRoot}/lib/app.ts`,
                content: `myapp.component("hello");`
            };
            const tsconfig: ts.tscWatch.File = {
                path: `${projectRoot}/tsconfig.json`,
                content: JSON.stringify({
                    compilerOptions: {
                        module: "none",
                        types: ["@myapp/ts-types"]
                    }
                })
            };
            const host = ts.tscWatch.createWatchedSystem([app, tsconfig, ts.tscWatch.libFile]);
            const watch = ts.tscWatch.createWatchOfConfigFile(tsconfig.path, host);
            ts.tscWatch.checkProgramActualFiles(watch(), [app.path, ts.tscWatch.libFile.path]);
            host.checkTimeoutQueueLength(0);
            ts.tscWatch.checkOutputErrorsInitial(host, [
                ts.createCompilerDiagnostic(ts.Diagnostics.Cannot_find_type_definition_file_for_0, "@myapp/ts-types")
            ]);
            host.ensureFileOrFolder({
                path: `${projectRoot}/node_modules/@myapp/ts-types/package.json`,
                content: JSON.stringify({
                    version: "1.65.1",
                    types: "types/somefile.define.d.ts"
                })
            });
            host.ensureFileOrFolder({
                path: `${projectRoot}/node_modules/@myapp/ts-types/types/somefile.define.d.ts`,
                content: `
declare namespace myapp {
    function component(str: string): number;
}`
            });
            host.checkTimeoutQueueLengthAndRun(1);
            ts.tscWatch.checkOutputErrorsIncremental(host, ts.emptyArray);
        });
    });
    describe("unittests:: tsc-watch:: resolutionCache:: tsc-watch with modules linked to sibling folder", () => {
        const mainPackageRoot = `${ts.tscWatch.projectRoot}/main`;
        const linkedPackageRoot = `${ts.tscWatch.projectRoot}/linked-package`;
        const mainFile: ts.tscWatch.File = {
            path: `${mainPackageRoot}/index.ts`,
            content: "import { Foo } from '@scoped/linked-package'"
        };
        const config: ts.tscWatch.File = {
            path: `${mainPackageRoot}/tsconfig.json`,
            content: JSON.stringify({
                compilerOptions: { module: "commonjs", moduleResolution: "node", baseUrl: ".", rootDir: "." },
                files: ["index.ts"]
            })
        };
        const linkedPackageInMain: ts.tscWatch.SymLink = {
            path: `${mainPackageRoot}/node_modules/@scoped/linked-package`,
            symLink: `${linkedPackageRoot}`
        };
        const linkedPackageJson: ts.tscWatch.File = {
            path: `${linkedPackageRoot}/package.json`,
            content: JSON.stringify({ name: "@scoped/linked-package", version: "0.0.1", types: "dist/index.d.ts", main: "dist/index.js" })
        };
        const linkedPackageIndex: ts.tscWatch.File = {
            path: `${linkedPackageRoot}/dist/index.d.ts`,
            content: "export * from './other';"
        };
        const linkedPackageOther: ts.tscWatch.File = {
            path: `${linkedPackageRoot}/dist/other.d.ts`,
            content: 'export declare const Foo = "BAR";'
        };
        it("verify watched directories", () => {
            const files = [ts.tscWatch.libFile, mainFile, config, linkedPackageInMain, linkedPackageJson, linkedPackageIndex, linkedPackageOther];
            const host = ts.tscWatch.createWatchedSystem(files, { currentDirectory: mainPackageRoot });
            ts.tscWatch.createWatchOfConfigFile("tsconfig.json", host);
            ts.tscWatch.checkWatchedFilesDetailed(host, [ts.tscWatch.libFile.path, mainFile.path, config.path, linkedPackageIndex.path, linkedPackageOther.path], 1);
            ts.tscWatch.checkWatchedDirectories(host, ts.emptyArray, /*recursive*/ false);
            ts.tscWatch.checkWatchedDirectoriesDetailed(host, [`${mainPackageRoot}/@scoped`, `${mainPackageRoot}/node_modules`, linkedPackageRoot, `${mainPackageRoot}/node_modules/@types`, `${ts.tscWatch.projectRoot}/node_modules/@types`], 1, /*recursive*/ true);
        });
    });
}
