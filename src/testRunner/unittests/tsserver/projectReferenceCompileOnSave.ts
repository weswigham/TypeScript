namespace ts.projectSystem {
    describe("unittests:: tsserver:: with project references and compile on save", () => {
        const dependecyLocation = `${ts.tscWatch.projectRoot}/dependency`;
        const usageLocation = `${ts.tscWatch.projectRoot}/usage`;
        const dependencyTs: ts.projectSystem.File = {
            path: `${dependecyLocation}/fns.ts`,
            content: `export function fn1() { }
export function fn2() { }
`
        };
        const dependencyConfig: ts.projectSystem.File = {
            path: `${dependecyLocation}/tsconfig.json`,
            content: JSON.stringify({
                compilerOptions: { composite: true, declarationDir: "../decls" },
                compileOnSave: true
            })
        };
        const usageTs: ts.projectSystem.File = {
            path: `${usageLocation}/usage.ts`,
            content: `import {
    fn1,
    fn2,
} from '../decls/fns'
fn1();
fn2();
`
        };
        const usageConfig: ts.projectSystem.File = {
            path: `${usageLocation}/tsconfig.json`,
            content: JSON.stringify({
                compileOnSave: true,
                references: [{ path: "../dependency" }]
            })
        };
        interface VerifySingleScenarioWorker extends VerifySingleScenario {
            withProject: boolean;
        }
        function verifySingleScenarioWorker({ withProject, scenario, openFiles, requestArgs, change, expectedResult }: VerifySingleScenarioWorker) {
            it(scenario, () => {
                const host = ts.TestFSWithWatch.changeToHostTrackingWrittenFiles(ts.projectSystem.createServerHost([dependencyTs, dependencyConfig, usageTs, usageConfig, ts.projectSystem.libFile]));
                const session = ts.projectSystem.createSession(host);
                ts.projectSystem.openFilesForSession(openFiles(), session);
                const reqArgs = requestArgs();
                const { expectedAffected, expectedEmit: { expectedEmitSuccess, expectedFiles }, expectedEmitOutput } = expectedResult(withProject);
                if (change) {
                    session.executeCommandSeq<ts.projectSystem.protocol.CompileOnSaveAffectedFileListRequest>({
                        command: ts.projectSystem.protocol.CommandTypes.CompileOnSaveAffectedFileList,
                        arguments: { file: dependencyTs.path }
                    });
                    const { file, insertString } = change();
                    if (session.getProjectService().openFiles.has(file.path)) {
                        const toLocation = ts.projectSystem.protocolToLocation(file.content);
                        const location = toLocation(file.content.length);
                        session.executeCommandSeq<ts.projectSystem.protocol.ChangeRequest>({
                            command: ts.projectSystem.protocol.CommandTypes.Change,
                            arguments: {
                                file: file.path,
                                ...location,
                                endLine: location.line,
                                endOffset: location.offset,
                                insertString
                            }
                        });
                    }
                    else {
                        host.writeFile(file.path, `${file.content}${insertString}`);
                    }
                    host.writtenFiles.clear();
                }
                const args = withProject ? reqArgs : { file: reqArgs.file };
                // Verify CompileOnSaveAffectedFileList
                const actualAffectedFiles = (session.executeCommandSeq<ts.projectSystem.protocol.CompileOnSaveAffectedFileListRequest>({
                    command: ts.projectSystem.protocol.CommandTypes.CompileOnSaveAffectedFileList,
                    arguments: args
                }).response as ts.projectSystem.protocol.CompileOnSaveAffectedFileListSingleProject[]);
                assert.deepEqual(actualAffectedFiles, expectedAffected, "Affected files");
                // Verify CompileOnSaveEmit
                const actualEmit = session.executeCommandSeq<ts.projectSystem.protocol.CompileOnSaveEmitFileRequest>({
                    command: ts.projectSystem.protocol.CommandTypes.CompileOnSaveEmitFile,
                    arguments: args
                }).response;
                assert.deepEqual(actualEmit, expectedEmitSuccess, "Emit files");
                assert.equal(host.writtenFiles.size, expectedFiles.length);
                for (const file of expectedFiles) {
                    assert.equal(host.readFile(file.path), file.content, `Expected to write ${file.path}`);
                    assert.isTrue(host.writtenFiles.has(file.path), `${file.path} is newly written`);
                }
                // Verify EmitOutput
                const { exportedModulesFromDeclarationEmit: _1, ...actualEmitOutput } = (session.executeCommandSeq<ts.projectSystem.protocol.EmitOutputRequest>({
                    command: ts.projectSystem.protocol.CommandTypes.EmitOutput,
                    arguments: args
                }).response as ts.EmitOutput);
                assert.deepEqual(actualEmitOutput, expectedEmitOutput, "Emit output");
            });
        }
        interface VerifySingleScenario {
            scenario: string;
            openFiles: () => readonly ts.projectSystem.File[];
            requestArgs: () => ts.projectSystem.protocol.FileRequestArgs;
            skipWithoutProject?: boolean;
            change?: () => SingleScenarioChange;
            expectedResult: GetSingleScenarioResult;
        }
        function verifySingleScenario(scenario: VerifySingleScenario) {
            if (!scenario.skipWithoutProject) {
                describe("without specifying project file", () => {
                    verifySingleScenarioWorker({
                        withProject: false,
                        ...scenario
                    });
                });
            }
            describe("with specifying project file", () => {
                verifySingleScenarioWorker({
                    withProject: true,
                    ...scenario
                });
            });
        }
        interface SingleScenarioExpectedEmit {
            expectedEmitSuccess: boolean;
            expectedFiles: readonly ts.projectSystem.File[];
        }
        interface SingleScenarioResult {
            expectedAffected: ts.projectSystem.protocol.CompileOnSaveAffectedFileListSingleProject[];
            expectedEmit: SingleScenarioExpectedEmit;
            expectedEmitOutput: ts.EmitOutput;
        }
        type GetSingleScenarioResult = (withProject: boolean) => SingleScenarioResult;
        interface SingleScenarioChange {
            file: ts.projectSystem.File;
            insertString: string;
        }
        interface ScenarioDetails {
            scenarioName: string;
            requestArgs: () => ts.projectSystem.protocol.FileRequestArgs;
            skipWithoutProject?: boolean;
            initial: GetSingleScenarioResult;
            localChangeToDependency: GetSingleScenarioResult;
            localChangeToUsage: GetSingleScenarioResult;
            changeToDependency: GetSingleScenarioResult;
            changeToUsage: GetSingleScenarioResult;
        }
        interface VerifyScenario {
            openFiles: () => readonly ts.projectSystem.File[];
            scenarios: readonly ScenarioDetails[];
        }
        const localChange = "function fn3() { }";
        const change = `export ${localChange}`;
        const changeJs = `function fn3() { }
exports.fn3 = fn3;`;
        const changeDts = "export declare function fn3(): void;";
        function verifyScenario({ openFiles, scenarios }: VerifyScenario) {
            for (const { scenarioName, requestArgs, skipWithoutProject, initial, localChangeToDependency, localChangeToUsage, changeToDependency, changeToUsage } of scenarios) {
                describe(scenarioName, () => {
                    verifySingleScenario({
                        scenario: "with initial file open",
                        openFiles,
                        requestArgs,
                        skipWithoutProject,
                        expectedResult: initial
                    });
                    verifySingleScenario({
                        scenario: "with local change to dependency",
                        openFiles,
                        requestArgs,
                        skipWithoutProject,
                        change: () => ({ file: dependencyTs, insertString: localChange }),
                        expectedResult: localChangeToDependency
                    });
                    verifySingleScenario({
                        scenario: "with local change to usage",
                        openFiles,
                        requestArgs,
                        skipWithoutProject,
                        change: () => ({ file: usageTs, insertString: localChange }),
                        expectedResult: localChangeToUsage
                    });
                    verifySingleScenario({
                        scenario: "with change to dependency",
                        openFiles,
                        requestArgs,
                        skipWithoutProject,
                        change: () => ({ file: dependencyTs, insertString: change }),
                        expectedResult: changeToDependency
                    });
                    verifySingleScenario({
                        scenario: "with change to usage",
                        openFiles,
                        requestArgs,
                        skipWithoutProject,
                        change: () => ({ file: usageTs, insertString: change }),
                        expectedResult: changeToUsage
                    });
                });
            }
        }
        function expectedAffectedFiles(config: ts.projectSystem.File, fileNames: ts.projectSystem.File[]): ts.projectSystem.protocol.CompileOnSaveAffectedFileListSingleProject {
            return {
                projectFileName: config.path,
                fileNames: fileNames.map(f => f.path),
                projectUsesOutFile: false
            };
        }
        function expectedUsageEmit(appendJsText?: string): SingleScenarioExpectedEmit {
            const appendJs = appendJsText ? `${appendJsText}
` : "";
            return {
                expectedEmitSuccess: true,
                expectedFiles: [{
                        path: `${usageLocation}/usage.js`,
                        content: `"use strict";
exports.__esModule = true;
var fns_1 = require("../decls/fns");
fns_1.fn1();
fns_1.fn2();
${appendJs}`
                    }]
            };
        }
        function expectedEmitOutput({ expectedFiles }: SingleScenarioExpectedEmit): ts.EmitOutput {
            return {
                outputFiles: expectedFiles.map(({ path, content }) => ({
                    name: path,
                    text: content,
                    writeByteOrderMark: false
                })),
                emitSkipped: false
            };
        }
        function expectedUsageEmitOutput(appendJsText?: string): ts.EmitOutput {
            return expectedEmitOutput(expectedUsageEmit(appendJsText));
        }
        function noEmit(): SingleScenarioExpectedEmit {
            return {
                expectedEmitSuccess: false,
                expectedFiles: ts.emptyArray
            };
        }
        function noEmitOutput(): ts.EmitOutput {
            return {
                emitSkipped: true,
                outputFiles: []
            };
        }
        function expectedDependencyEmit(appendJsText?: string, appendDtsText?: string): SingleScenarioExpectedEmit {
            const appendJs = appendJsText ? `${appendJsText}
` : "";
            const appendDts = appendDtsText ? `${appendDtsText}
` : "";
            return {
                expectedEmitSuccess: true,
                expectedFiles: [
                    {
                        path: `${dependecyLocation}/fns.js`,
                        content: `"use strict";
exports.__esModule = true;
function fn1() { }
exports.fn1 = fn1;
function fn2() { }
exports.fn2 = fn2;
${appendJs}`
                    },
                    {
                        path: `${ts.tscWatch.projectRoot}/decls/fns.d.ts`,
                        content: `export declare function fn1(): void;
export declare function fn2(): void;
${appendDts}`
                    }
                ]
            };
        }
        function expectedDependencyEmitOutput(appendJsText?: string, appendDtsText?: string): ts.EmitOutput {
            return expectedEmitOutput(expectedDependencyEmit(appendJsText, appendDtsText));
        }
        function scenarioDetailsOfUsage(isDependencyOpen?: boolean): ScenarioDetails[] {
            return [
                {
                    scenarioName: "Of usageTs",
                    requestArgs: () => ({ file: usageTs.path, projectFileName: usageConfig.path }),
                    initial: () => initialUsageTs(),
                    // no change to usage so same as initial only usage file
                    localChangeToDependency: () => initialUsageTs(),
                    localChangeToUsage: () => initialUsageTs(localChange),
                    changeToDependency: () => initialUsageTs(),
                    changeToUsage: () => initialUsageTs(changeJs)
                },
                {
                    scenarioName: "Of dependencyTs in usage project",
                    requestArgs: () => ({ file: dependencyTs.path, projectFileName: usageConfig.path }),
                    skipWithoutProject: !!isDependencyOpen,
                    initial: () => initialDependencyTs(),
                    localChangeToDependency: () => initialDependencyTs(/*noUsageFiles*/ true),
                    localChangeToUsage: () => initialDependencyTs(/*noUsageFiles*/ true),
                    changeToDependency: () => initialDependencyTs(),
                    changeToUsage: () => initialDependencyTs(/*noUsageFiles*/ true)
                }
            ];
            function initialUsageTs(jsText?: string) {
                return {
                    expectedAffected: [
                        expectedAffectedFiles(usageConfig, [usageTs])
                    ],
                    expectedEmit: expectedUsageEmit(jsText),
                    expectedEmitOutput: expectedUsageEmitOutput(jsText)
                };
            }
            function initialDependencyTs(noUsageFiles?: true) {
                return {
                    expectedAffected: [
                        expectedAffectedFiles(usageConfig, noUsageFiles ? [] : [usageTs])
                    ],
                    expectedEmit: noEmit(),
                    expectedEmitOutput: noEmitOutput()
                };
            }
        }
        function scenarioDetailsOfDependencyWhenOpen(): ScenarioDetails {
            return {
                scenarioName: "Of dependencyTs",
                requestArgs: () => ({ file: dependencyTs.path, projectFileName: dependencyConfig.path }),
                initial,
                localChangeToDependency: withProject => ({
                    expectedAffected: withProject ?
                        [
                            expectedAffectedFiles(dependencyConfig, [dependencyTs])
                        ] :
                        [
                            expectedAffectedFiles(usageConfig, []),
                            expectedAffectedFiles(dependencyConfig, [dependencyTs])
                        ],
                    expectedEmit: expectedDependencyEmit(localChange),
                    expectedEmitOutput: expectedDependencyEmitOutput(localChange)
                }),
                localChangeToUsage: withProject => initial(withProject, /*noUsageFiles*/ true),
                changeToDependency: withProject => initial(withProject, /*noUsageFiles*/ undefined, changeJs, changeDts),
                changeToUsage: withProject => initial(withProject, /*noUsageFiles*/ true)
            };
            function initial(withProject: boolean, noUsageFiles?: true, appendJs?: string, appendDts?: string): SingleScenarioResult {
                return {
                    expectedAffected: withProject ?
                        [
                            expectedAffectedFiles(dependencyConfig, [dependencyTs])
                        ] :
                        [
                            expectedAffectedFiles(usageConfig, noUsageFiles ? [] : [usageTs]),
                            expectedAffectedFiles(dependencyConfig, [dependencyTs])
                        ],
                    expectedEmit: expectedDependencyEmit(appendJs, appendDts),
                    expectedEmitOutput: expectedDependencyEmitOutput(appendJs, appendDts)
                };
            }
        }
        describe("when dependency project is not open", () => {
            verifyScenario({
                openFiles: () => [usageTs],
                scenarios: scenarioDetailsOfUsage()
            });
        });
        describe("when the depedency file is open", () => {
            verifyScenario({
                openFiles: () => [usageTs, dependencyTs],
                scenarios: [
                    ...scenarioDetailsOfUsage(/*isDependencyOpen*/ true),
                    scenarioDetailsOfDependencyWhenOpen(),
                ]
            });
        });
    });
    describe("unittests:: tsserver:: with project references and compile on save with external projects", () => {
        it("compile on save emits same output as project build", () => {
            const tsbaseJson: ts.projectSystem.File = {
                path: `${ts.tscWatch.projectRoot}/tsbase.json`,
                content: JSON.stringify({
                    compileOnSave: true,
                    compilerOptions: {
                        module: "none",
                        composite: true
                    }
                })
            };
            const buttonClass = `${ts.tscWatch.projectRoot}/buttonClass`;
            const buttonConfig: ts.projectSystem.File = {
                path: `${buttonClass}/tsconfig.json`,
                content: JSON.stringify({
                    extends: "../tsbase.json",
                    compilerOptions: {
                        outFile: "Source.js"
                    },
                    files: ["Source.ts"]
                })
            };
            const buttonSource: ts.projectSystem.File = {
                path: `${buttonClass}/Source.ts`,
                content: `module Hmi {
    export class Button {
        public static myStaticFunction() {
        }
    }
}`
            };
            const siblingClass = `${ts.tscWatch.projectRoot}/SiblingClass`;
            const siblingConfig: ts.projectSystem.File = {
                path: `${siblingClass}/tsconfig.json`,
                content: JSON.stringify({
                    extends: "../tsbase.json",
                    references: [{
                            path: "../buttonClass/"
                        }],
                    compilerOptions: {
                        outFile: "Source.js"
                    },
                    files: ["Source.ts"]
                })
            };
            const siblingSource: ts.projectSystem.File = {
                path: `${siblingClass}/Source.ts`,
                content: `module Hmi {
    export class Sibling {
        public mySiblingFunction() {
        }
    }
}`
            };
            const host = ts.projectSystem.createServerHost([ts.projectSystem.libFile, tsbaseJson, buttonConfig, buttonSource, siblingConfig, siblingSource], { useCaseSensitiveFileNames: true });
            // ts build should succeed
            const solutionBuilder = ts.tscWatch.createSolutionBuilder(host, [siblingConfig.path], {});
            solutionBuilder.build();
            assert.equal(host.getOutput().length, 0, JSON.stringify(host.getOutput(), /*replacer*/ undefined, " "));
            const sourceJs = ts.changeExtension(siblingSource.path, ".js");
            const expectedSiblingJs = host.readFile(sourceJs);
            const session = ts.projectSystem.createSession(host);
            ts.projectSystem.openFilesForSession([siblingSource], session);
            session.executeCommandSeq<ts.projectSystem.protocol.CompileOnSaveEmitFileRequest>({
                command: ts.projectSystem.protocol.CommandTypes.CompileOnSaveEmitFile,
                arguments: {
                    file: siblingSource.path,
                    projectFileName: siblingConfig.path
                }
            });
            assert.equal(host.readFile(sourceJs), expectedSiblingJs);
        });
    });
}
