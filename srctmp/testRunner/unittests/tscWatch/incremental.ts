import * as ts from "../../ts";
import * as fakes from "../../fakes";
import * as Harness from "../../Harness";
describe("unittests:: tsc-watch:: emit file --incremental", () => {
    const project = "/users/username/projects/project";
    const configFile: ts.tscWatch.File = {
        path: `${project}/tsconfig.json`,
        content: JSON.stringify({ compilerOptions: { incremental: true } })
    };
    interface VerifyIncrementalWatchEmitInput {
        files: readonly ts.tscWatch.File[];
        optionsToExtend?: ts.CompilerOptions;
        expectedInitialEmit: readonly ts.tscWatch.File[];
        expectedInitialErrors: readonly string[];
        modifyFs?: (host: ts.tscWatch.WatchedSystem) => void;
        expectedIncrementalEmit?: readonly ts.tscWatch.File[];
        expectedIncrementalErrors?: readonly string[];
    }
    function verifyIncrementalWatchEmit(input: () => VerifyIncrementalWatchEmitInput) {
        it("with tsc --w", () => {
            verifyIncrementalWatchEmitWorker({
                input: input(),
                emitAndReportErrors: ts.tscWatch.createWatchOfConfigFile,
                verifyErrors: ts.tscWatch.checkOutputErrorsInitial
            });
        });
        it("with tsc", () => {
            verifyIncrementalWatchEmitWorker({
                input: input(),
                emitAndReportErrors: incrementalBuild,
                verifyErrors: ts.tscWatch.checkNormalBuildErrors
            });
        });
    }
    function incrementalBuild(configFile: string, host: ts.tscWatch.WatchedSystem, optionsToExtend?: ts.CompilerOptions) {
        const reportDiagnostic = ts.createDiagnosticReporter(host);
        const config = ts.parseConfigFileWithSystem(configFile, optionsToExtend || {}, /*watchOptionsToExtend*/ undefined, host, reportDiagnostic);
        if (config) {
            ts.performIncrementalCompilation({
                rootNames: config.fileNames,
                options: config.options,
                projectReferences: config.projectReferences,
                configFileParsingDiagnostics: ts.getConfigFileParsingDiagnostics(config),
                reportDiagnostic,
                system: host
            });
        }
        return { close: ts.noop };
    }
    interface VerifyIncrementalWatchEmitWorkerInput {
        input: VerifyIncrementalWatchEmitInput;
        emitAndReportErrors: (configFile: string, host: ts.tscWatch.WatchedSystem, optionsToExtend?: ts.CompilerOptions) => {
            close(): void;
        };
        verifyErrors: (host: ts.tscWatch.WatchedSystem, errors: readonly string[]) => void;
    }
    function verifyIncrementalWatchEmitWorker({ input: { files, optionsToExtend, expectedInitialEmit, expectedInitialErrors, modifyFs, expectedIncrementalEmit, expectedIncrementalErrors }, emitAndReportErrors, verifyErrors }: VerifyIncrementalWatchEmitWorkerInput) {
        const host = ts.tscWatch.createWatchedSystem(files, { currentDirectory: project });
        const originalWriteFile = host.writeFile;
        const writtenFiles = ts.createMap<string>();
        host.writeFile = (path, content) => {
            assert.isFalse(writtenFiles.has(path));
            writtenFiles.set(path, content);
            originalWriteFile.call(host, path, content);
        };
        verifyBuild({
            host,
            optionsToExtend,
            writtenFiles,
            emitAndReportErrors,
            verifyErrors,
            expectedEmit: expectedInitialEmit,
            expectedErrors: expectedInitialErrors
        });
        if (modifyFs) {
            modifyFs(host);
            verifyBuild({
                host,
                optionsToExtend,
                writtenFiles,
                emitAndReportErrors,
                verifyErrors,
                expectedEmit: ts.Debug.assertDefined(expectedIncrementalEmit),
                expectedErrors: ts.Debug.assertDefined(expectedIncrementalErrors)
            });
        }
    }
    interface VerifyBuildWorker {
        host: ts.tscWatch.WatchedSystem;
        optionsToExtend?: ts.CompilerOptions;
        writtenFiles: ts.Map<string>;
        emitAndReportErrors: VerifyIncrementalWatchEmitWorkerInput["emitAndReportErrors"];
        verifyErrors: VerifyIncrementalWatchEmitWorkerInput["verifyErrors"];
        expectedEmit: readonly ts.tscWatch.File[];
        expectedErrors: readonly string[];
    }
    function verifyBuild({ host, optionsToExtend, writtenFiles, emitAndReportErrors, verifyErrors, expectedEmit, expectedErrors }: VerifyBuildWorker) {
        writtenFiles.clear();
        const result = emitAndReportErrors("tsconfig.json", host, optionsToExtend);
        checkFileEmit(writtenFiles, expectedEmit);
        verifyErrors(host, expectedErrors);
        result.close();
    }
    function sanitizeBuildInfo(content: string) {
        const buildInfo = ts.getBuildInfo(content);
        fakes.sanitizeBuildInfoProgram(buildInfo);
        return ts.getBuildInfoText(buildInfo);
    }
    function checkFileEmit(actual: ts.Map<string>, expected: readonly ts.tscWatch.File[]) {
        assert.equal(actual.size, expected.length, `Actual: ${JSON.stringify(ts.arrayFrom(actual.entries()), /*replacer*/ undefined, " ")}\nExpected: ${JSON.stringify(expected, /*replacer*/ undefined, " ")}`);
        for (const file of expected) {
            let expectedContent = file.content;
            let actualContent = actual.get(file.path);
            if (ts.isBuildInfoFile(file.path)) {
                actualContent = actualContent && sanitizeBuildInfo(actualContent);
                expectedContent = sanitizeBuildInfo(expectedContent);
            }
            assert.equal(actualContent, expectedContent, `Emit for ${file.path}`);
        }
    }
    const libFileInfo: ts.BuilderState.FileInfo = {
        version: Harness.mockHash(ts.tscWatch.libFile.content),
        signature: Harness.mockHash(ts.tscWatch.libFile.content)
    };
    const getCanonicalFileName = ts.createGetCanonicalFileName(/*useCaseSensitiveFileNames*/ false);
    function relativeToBuildInfo(buildInfoPath: string, path: string) {
        return ts.getRelativePathFromFile(buildInfoPath, path, getCanonicalFileName);
    }
    const buildInfoPath = `${project}/tsconfig.tsbuildinfo`;
    const [libFilePath, file1Path, file2Path] = [ts.tscWatch.libFile.path, `${project}/file1.ts`, `${project}/file2.ts`].map(path => relativeToBuildInfo(buildInfoPath, path));
    describe("non module compilation", () => {
        function getFileInfo(content: string): ts.BuilderState.FileInfo {
            return { version: Harness.mockHash(content), signature: Harness.mockHash(`declare ${content}\n`) };
        }
        const file1: ts.tscWatch.File = {
            path: `${project}/file1.ts`,
            content: "const x = 10;"
        };
        const file2: ts.tscWatch.File = {
            path: `${project}/file2.ts`,
            content: "const y = 20;"
        };
        const file1Js: ts.tscWatch.File = {
            path: `${project}/file1.js`,
            content: "var x = 10;\n"
        };
        const file2Js: ts.tscWatch.File = {
            path: `${project}/file2.js`,
            content: "var y = 20;\n"
        };
        describe("own file emit without errors", () => {
            function verify(optionsToExtend?: ts.CompilerOptions, expectedBuildinfoOptions?: ts.CompilerOptions) {
                const modifiedFile2Content = file2.content.replace("y", "z").replace("20", "10");
                verifyIncrementalWatchEmit(() => ({
                    files: [ts.tscWatch.libFile, file1, file2, configFile],
                    optionsToExtend,
                    expectedInitialEmit: [
                        file1Js,
                        file2Js,
                        {
                            path: `${project}/tsconfig.tsbuildinfo`,
                            content: ts.getBuildInfoText({
                                program: {
                                    fileInfos: {
                                        [libFilePath]: libFileInfo,
                                        [file1Path]: getFileInfo(file1.content),
                                        [file2Path]: getFileInfo(file2.content)
                                    },
                                    options: {
                                        incremental: true,
                                        ...expectedBuildinfoOptions,
                                        configFilePath: "./tsconfig.json"
                                    },
                                    referencedMap: {},
                                    exportedModulesMap: {},
                                    semanticDiagnosticsPerFile: [libFilePath, file1Path, file2Path]
                                },
                                version: ts.version // eslint-disable-line @typescript-eslint/no-unnecessary-qualifier
                            })
                        }
                    ],
                    expectedInitialErrors: ts.emptyArray,
                    modifyFs: host => host.writeFile(file2.path, modifiedFile2Content),
                    expectedIncrementalEmit: [
                        file1Js,
                        { path: file2Js.path, content: file2Js.content.replace("y", "z").replace("20", "10") },
                        {
                            path: `${project}/tsconfig.tsbuildinfo`,
                            content: ts.getBuildInfoText({
                                program: {
                                    fileInfos: {
                                        [libFilePath]: libFileInfo,
                                        [file1Path]: getFileInfo(file1.content),
                                        [file2Path]: getFileInfo(modifiedFile2Content)
                                    },
                                    options: {
                                        incremental: true,
                                        ...expectedBuildinfoOptions,
                                        configFilePath: "./tsconfig.json"
                                    },
                                    referencedMap: {},
                                    exportedModulesMap: {},
                                    semanticDiagnosticsPerFile: [libFilePath, file1Path, file2Path]
                                },
                                version: ts.version // eslint-disable-line @typescript-eslint/no-unnecessary-qualifier
                            })
                        }
                    ],
                    expectedIncrementalErrors: ts.emptyArray,
                }));
            }
            verify();
            describe("with commandline parameters that are not relative", () => {
                verify({ project: "tsconfig.json" }, { project: "./tsconfig.json" });
            });
        });
        describe("own file emit with errors", () => {
            const fileModified: ts.tscWatch.File = {
                path: file2.path,
                content: `const y: string = 20;`
            };
            const file2FileInfo: ts.BuilderState.FileInfo = {
                version: Harness.mockHash(fileModified.content),
                signature: Harness.mockHash("declare const y: string;\n")
            };
            const file2ReuasableError: ts.ProgramBuildInfoDiagnostic = [
                file2Path, [
                    {
                        file: file2Path,
                        start: 6,
                        length: 1,
                        code: ts.Diagnostics.Type_0_is_not_assignable_to_type_1.code,
                        category: ts.Diagnostics.Type_0_is_not_assignable_to_type_1.category,
                        messageText: "Type '20' is not assignable to type 'string'."
                    }
                ]
            ];
            const file2Errors = [
                "file2.ts(1,7): error TS2322: Type '20' is not assignable to type 'string'.\n"
            ];
            const modifiedFile1Content = file1.content.replace("x", "z");
            verifyIncrementalWatchEmit(() => ({
                files: [ts.tscWatch.libFile, file1, fileModified, configFile],
                expectedInitialEmit: [
                    file1Js,
                    file2Js,
                    {
                        path: `${project}/tsconfig.tsbuildinfo`,
                        content: ts.getBuildInfoText({
                            program: {
                                fileInfos: {
                                    [libFilePath]: libFileInfo,
                                    [file1Path]: getFileInfo(file1.content),
                                    [file2Path]: file2FileInfo
                                },
                                options: {
                                    incremental: true,
                                    configFilePath: "./tsconfig.json"
                                },
                                referencedMap: {},
                                exportedModulesMap: {},
                                semanticDiagnosticsPerFile: [
                                    libFilePath,
                                    file1Path,
                                    file2ReuasableError
                                ]
                            },
                            version: ts.version // eslint-disable-line @typescript-eslint/no-unnecessary-qualifier
                        })
                    }
                ],
                expectedInitialErrors: file2Errors,
                modifyFs: host => host.writeFile(file1.path, modifiedFile1Content),
                expectedIncrementalEmit: [
                    { path: file1Js.path, content: file1Js.content.replace("x", "z") },
                    file2Js,
                    {
                        path: `${project}/tsconfig.tsbuildinfo`,
                        content: ts.getBuildInfoText({
                            program: {
                                fileInfos: {
                                    [libFilePath]: libFileInfo,
                                    [file1Path]: getFileInfo(modifiedFile1Content),
                                    [file2Path]: file2FileInfo
                                },
                                options: {
                                    incremental: true,
                                    configFilePath: "./tsconfig.json"
                                },
                                referencedMap: {},
                                exportedModulesMap: {},
                                semanticDiagnosticsPerFile: [
                                    libFilePath,
                                    file1Path,
                                    file2ReuasableError
                                ]
                            },
                            version: ts.version // eslint-disable-line @typescript-eslint/no-unnecessary-qualifier
                        })
                    }
                ],
                expectedIncrementalErrors: file2Errors,
            }));
        });
        describe("with --out", () => {
            const config: ts.tscWatch.File = {
                path: configFile.path,
                content: JSON.stringify({ compilerOptions: { incremental: true, outFile: "out.js" } })
            };
            const outFile: ts.tscWatch.File = {
                path: `${project}/out.js`,
                content: "var x = 10;\nvar y = 20;\n"
            };
            verifyIncrementalWatchEmit(() => ({
                files: [ts.tscWatch.libFile, file1, file2, config],
                expectedInitialEmit: [
                    outFile,
                    {
                        path: `${project}/out.tsbuildinfo`,
                        content: ts.getBuildInfoText({
                            bundle: {
                                commonSourceDirectory: relativeToBuildInfo(`${project}/out.tsbuildinfo`, `${project}/`),
                                sourceFiles: [file1Path, file2Path],
                                js: {
                                    sections: [
                                        { pos: 0, end: outFile.content.length, kind: ts.BundleFileSectionKind.Text }
                                    ]
                                },
                            },
                            version: ts.version // eslint-disable-line @typescript-eslint/no-unnecessary-qualifier
                        })
                    }
                ],
                expectedInitialErrors: ts.emptyArray
            }));
        });
    });
    describe("module compilation", () => {
        function getFileInfo(content: string): ts.BuilderState.FileInfo {
            return {
                version: Harness.mockHash(content),
                signature: Harness.mockHash(`${content.replace("export ", "export declare ")}\n`)
            };
        }
        function getEmitContent(varName: string, value: string) {
            return `define(["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    exports.${varName} = ${value};
});
`;
        }
        const file1: ts.tscWatch.File = {
            path: `${project}/file1.ts`,
            content: "export const x = 10;"
        };
        const file2: ts.tscWatch.File = {
            path: `${project}/file2.ts`,
            content: "export const y = 20;"
        };
        const file1Js: ts.tscWatch.File = {
            path: `${project}/file1.js`,
            content: getEmitContent("x", "10")
        };
        const file2Js: ts.tscWatch.File = {
            path: `${project}/file2.js`,
            content: getEmitContent("y", "20")
        };
        const config: ts.tscWatch.File = {
            path: configFile.path,
            content: JSON.stringify({ compilerOptions: { incremental: true, module: "amd" } })
        };
        describe("own file emit without errors", () => {
            const modifiedFile2Content = file2.content.replace("y", "z").replace("20", "10");
            verifyIncrementalWatchEmit(() => ({
                files: [ts.tscWatch.libFile, file1, file2, config],
                expectedInitialEmit: [
                    file1Js,
                    file2Js,
                    {
                        path: `${project}/tsconfig.tsbuildinfo`,
                        content: ts.getBuildInfoText({
                            program: {
                                fileInfos: {
                                    [libFilePath]: libFileInfo,
                                    [file1Path]: getFileInfo(file1.content),
                                    [file2Path]: getFileInfo(file2.content)
                                },
                                options: {
                                    incremental: true,
                                    module: ts.ModuleKind.AMD,
                                    configFilePath: "./tsconfig.json"
                                },
                                referencedMap: {},
                                exportedModulesMap: {},
                                semanticDiagnosticsPerFile: [libFilePath, file1Path, file2Path]
                            },
                            version: ts.version // eslint-disable-line @typescript-eslint/no-unnecessary-qualifier
                        })
                    }
                ],
                expectedInitialErrors: ts.emptyArray,
                modifyFs: host => host.writeFile(file2.path, modifiedFile2Content),
                expectedIncrementalEmit: [
                    { path: `${project}/file2.js`, content: getEmitContent("z", "10") },
                    {
                        path: `${project}/tsconfig.tsbuildinfo`,
                        content: ts.getBuildInfoText({
                            program: {
                                fileInfos: {
                                    [libFilePath]: libFileInfo,
                                    [file1Path]: getFileInfo(file1.content),
                                    [file2Path]: getFileInfo(modifiedFile2Content)
                                },
                                options: {
                                    incremental: true,
                                    module: ts.ModuleKind.AMD,
                                    configFilePath: "./tsconfig.json"
                                },
                                referencedMap: {},
                                exportedModulesMap: {},
                                semanticDiagnosticsPerFile: [libFilePath, file1Path, file2Path]
                            },
                            version: ts.version // eslint-disable-line @typescript-eslint/no-unnecessary-qualifier
                        })
                    }
                ],
                expectedIncrementalErrors: ts.emptyArray,
            }));
        });
        describe("own file emit with errors", () => {
            const fileModified: ts.tscWatch.File = {
                path: file2.path,
                content: `export const y: string = 20;`
            };
            const file2FileInfo: ts.BuilderState.FileInfo = {
                version: Harness.mockHash(fileModified.content),
                signature: Harness.mockHash("export declare const y: string;\n")
            };
            const file2ReuasableError: ts.ProgramBuildInfoDiagnostic = [
                file2Path, [
                    {
                        file: file2Path,
                        start: 13,
                        length: 1,
                        code: ts.Diagnostics.Type_0_is_not_assignable_to_type_1.code,
                        category: ts.Diagnostics.Type_0_is_not_assignable_to_type_1.category,
                        messageText: "Type '20' is not assignable to type 'string'."
                    }
                ]
            ];
            const file2Errors = [
                "file2.ts(1,14): error TS2322: Type '20' is not assignable to type 'string'.\n"
            ];
            const modifiedFile1Content = file1.content.replace("x = 10", "z = 10");
            verifyIncrementalWatchEmit(() => ({
                files: [ts.tscWatch.libFile, file1, fileModified, config],
                expectedInitialEmit: [
                    file1Js,
                    file2Js,
                    {
                        path: `${project}/tsconfig.tsbuildinfo`,
                        content: ts.getBuildInfoText({
                            program: {
                                fileInfos: {
                                    [libFilePath]: libFileInfo,
                                    [file1Path]: getFileInfo(file1.content),
                                    [file2Path]: file2FileInfo
                                },
                                options: {
                                    incremental: true,
                                    module: ts.ModuleKind.AMD,
                                    configFilePath: "./tsconfig.json"
                                },
                                referencedMap: {},
                                exportedModulesMap: {},
                                semanticDiagnosticsPerFile: [
                                    libFilePath,
                                    file1Path,
                                    file2ReuasableError
                                ]
                            },
                            version: ts.version // eslint-disable-line @typescript-eslint/no-unnecessary-qualifier
                        })
                    }
                ],
                expectedInitialErrors: file2Errors,
                modifyFs: host => host.writeFile(file1.path, modifiedFile1Content),
                expectedIncrementalEmit: [
                    { path: file1Js.path, content: file1Js.content.replace("x = 10", "z = 10") },
                    {
                        path: `${project}/tsconfig.tsbuildinfo`,
                        content: ts.getBuildInfoText({
                            program: {
                                fileInfos: {
                                    [libFilePath]: libFileInfo,
                                    [file1Path]: getFileInfo(modifiedFile1Content),
                                    [file2Path]: file2FileInfo
                                },
                                options: {
                                    incremental: true,
                                    module: ts.ModuleKind.AMD,
                                    configFilePath: "./tsconfig.json"
                                },
                                referencedMap: {},
                                exportedModulesMap: {},
                                semanticDiagnosticsPerFile: [
                                    libFilePath,
                                    file2ReuasableError,
                                    file1Path
                                ]
                            },
                            version: ts.version // eslint-disable-line @typescript-eslint/no-unnecessary-qualifier
                        })
                    }
                ],
                expectedIncrementalErrors: file2Errors,
            }));
            it("verify that state is read correctly", () => {
                const system = ts.tscWatch.createWatchedSystem([ts.tscWatch.libFile, file1, fileModified, config], { currentDirectory: project });
                incrementalBuild("tsconfig.json", system);
                const command = (ts.parseConfigFileWithSystem("tsconfig.json", {}, /*watchOptionsToExtend*/ undefined, system, ts.noop)!);
                const builderProgram = ts.createIncrementalProgram({
                    rootNames: command.fileNames,
                    options: command.options,
                    projectReferences: command.projectReferences,
                    configFileParsingDiagnostics: ts.getConfigFileParsingDiagnostics(command),
                    host: ts.createIncrementalCompilerHost(command.options, system)
                });
                const state = builderProgram.getState();
                assert.equal(state.changedFilesSet!.size, 0, "changes");
                assert.equal(state.fileInfos.size, 3, "FileInfo size");
                assert.deepEqual(state.fileInfos.get(ts.tscWatch.libFile.path), libFileInfo);
                assert.deepEqual(state.fileInfos.get(file1.path), getFileInfo(file1.content));
                assert.deepEqual(state.fileInfos.get(file2.path), file2FileInfo);
                assert.deepEqual(state.compilerOptions, {
                    incremental: true,
                    module: ts.ModuleKind.AMD,
                    configFilePath: config.path
                });
                assert.equal(state.referencedMap!.size, 0);
                assert.equal(state.exportedModulesMap!.size, 0);
                assert.equal(state.semanticDiagnosticsPerFile!.size, 3);
                assert.deepEqual(state.semanticDiagnosticsPerFile!.get(ts.tscWatch.libFile.path), ts.emptyArray);
                assert.deepEqual(state.semanticDiagnosticsPerFile!.get(file1.path), ts.emptyArray);
                const { file: _, relatedInformation: __, ...rest } = file2ReuasableError[1][0];
                assert.deepEqual(state.semanticDiagnosticsPerFile!.get(file2.path), [{
                        ...rest,
                        file: (state.program!.getSourceFileByPath((file2.path as ts.Path))!),
                        relatedInformation: undefined,
                        reportsUnnecessary: undefined,
                        source: undefined
                    }]);
            });
        });
        describe("with --out", () => {
            const config: ts.tscWatch.File = {
                path: configFile.path,
                content: JSON.stringify({ compilerOptions: { incremental: true, module: "amd", outFile: "out.js" } })
            };
            const outFile: ts.tscWatch.File = {
                path: `${project}/out.js`,
                content: `${getEmitContent("file1", "x", "10")}${getEmitContent("file2", "y", "20")}`
            };
            function getEmitContent(file: string, varName: string, value: string) {
                return `define("${file}", ["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    exports.${varName} = ${value};
});
`;
            }
            verifyIncrementalWatchEmit(() => ({
                files: [ts.tscWatch.libFile, file1, file2, config],
                expectedInitialEmit: [
                    outFile,
                    {
                        path: `${project}/out.tsbuildinfo`,
                        content: ts.getBuildInfoText({
                            bundle: {
                                commonSourceDirectory: relativeToBuildInfo(`${project}/out.tsbuildinfo`, `${project}/`),
                                sourceFiles: [file1Path, file2Path],
                                js: {
                                    sections: [
                                        { pos: 0, end: outFile.content.length, kind: ts.BundleFileSectionKind.Text }
                                    ]
                                },
                            },
                            version: ts.version // eslint-disable-line @typescript-eslint/no-unnecessary-qualifier
                        })
                    }
                ],
                expectedInitialErrors: ts.emptyArray
            }));
        });
    });
    describe("incremental with circular references", () => {
        function getFileInfo(content: string): ts.BuilderState.FileInfo {
            const signature = Harness.mockHash(content);
            return { version: signature, signature };
        }
        const config: ts.tscWatch.File = {
            path: configFile.path,
            content: JSON.stringify({
                compilerOptions: {
                    incremental: true,
                    target: "es5",
                    module: "commonjs",
                    declaration: true,
                    emitDeclarationOnly: true
                }
            })
        };
        const aTs: ts.tscWatch.File = {
            path: `${project}/a.ts`,
            content: `import { B } from "./b";
export interface A {
    b: B;
}
`
        };
        const bTs: ts.tscWatch.File = {
            path: `${project}/b.ts`,
            content: `import { C } from "./c";
export interface B {
    b: C;
}
`
        };
        const cTs: ts.tscWatch.File = {
            path: `${project}/c.ts`,
            content: `import { A } from "./a";
export interface C {
    a: A;
}
`
        };
        const indexTs: ts.tscWatch.File = {
            path: `${project}/index.ts`,
            content: `export { A } from "./a";
export { B } from "./b";
export { C } from "./c";
`
        };
        verifyIncrementalWatchEmit(() => {
            const referencedMap: ts.MapLike<string[]> = {
                "./a.ts": ["./b.ts"],
                "./b.ts": ["./c.ts"],
                "./c.ts": ["./a.ts"],
                "./index.ts": ["./a.ts", "./b.ts", "./c.ts"],
            };
            const initialProgram: ts.ProgramBuildInfo = {
                fileInfos: {
                    [libFilePath]: libFileInfo,
                    "./c.ts": getFileInfo(cTs.content),
                    "./b.ts": getFileInfo(bTs.content),
                    "./a.ts": getFileInfo(aTs.content),
                    "./index.ts": getFileInfo(indexTs.content)
                },
                options: {
                    incremental: true,
                    target: ts.ScriptTarget.ES5,
                    module: ts.ModuleKind.CommonJS,
                    declaration: true,
                    emitDeclarationOnly: true,
                    configFilePath: "./tsconfig.json"
                },
                referencedMap,
                exportedModulesMap: referencedMap,
                semanticDiagnosticsPerFile: [
                    libFilePath,
                    "./a.ts",
                    "./b.ts",
                    "./c.ts",
                    "./index.ts",
                ]
            };
            const { fileInfos, ...rest } = initialProgram;
            const expectedADts: ts.tscWatch.File = { path: `${project}/a.d.ts`, content: aTs.content };
            const expectedBDts: ts.tscWatch.File = { path: `${project}/b.d.ts`, content: bTs.content };
            const expectedCDts: ts.tscWatch.File = { path: `${project}/c.d.ts`, content: cTs.content };
            const expectedIndexDts: ts.tscWatch.File = { path: `${project}/index.d.ts`, content: indexTs.content };
            const modifiedATsContent = aTs.content.replace("b: B;", `b: B;
    foo: any;`);
            return {
                files: [ts.tscWatch.libFile, aTs, bTs, cTs, indexTs, config],
                expectedInitialEmit: [
                    expectedADts,
                    expectedBDts,
                    expectedCDts,
                    expectedIndexDts,
                    {
                        path: `${project}/tsconfig.tsbuildinfo`,
                        content: ts.getBuildInfoText({
                            program: initialProgram,
                            version: ts.version // eslint-disable-line @typescript-eslint/no-unnecessary-qualifier
                        })
                    }
                ],
                expectedInitialErrors: ts.emptyArray,
                modifyFs: host => host.writeFile(aTs.path, modifiedATsContent),
                expectedIncrementalEmit: [
                    { path: expectedADts.path, content: modifiedATsContent },
                    expectedBDts,
                    expectedCDts,
                    expectedIndexDts,
                    {
                        path: `${project}/tsconfig.tsbuildinfo`,
                        content: ts.getBuildInfoText({
                            program: {
                                fileInfos: {
                                    [libFilePath]: libFileInfo,
                                    "./c.ts": getFileInfo(cTs.content),
                                    "./b.ts": getFileInfo(bTs.content),
                                    "./a.ts": getFileInfo(modifiedATsContent),
                                    "./index.ts": getFileInfo(indexTs.content)
                                },
                                ...rest
                            },
                            version: ts.version // eslint-disable-line @typescript-eslint/no-unnecessary-qualifier
                        })
                    }
                ],
                expectedIncrementalErrors: ts.emptyArray
            };
        });
    });
});
