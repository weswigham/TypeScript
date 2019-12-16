import * as ts from "../../ts";
import * as vfs from "../../vfs";
import * as fakes from "../../fakes";
describe("unittests:: tsbuild:: outFile::", () => {
    let outFileFs: vfs.FileSystem;
    const enum ext {
        js,
        jsmap,
        dts,
        dtsmap,
        buildinfo
    }
    const enum project {
        first,
        second,
        third
    }
    type OutputFile = [string, string, string, string, string];
    function relName(path: string) { return path.slice(1); }
    const outputFiles: [OutputFile, OutputFile, OutputFile] = [
        [
            "/src/first/bin/first-output.js",
            "/src/first/bin/first-output.js.map",
            "/src/first/bin/first-output.d.ts",
            "/src/first/bin/first-output.d.ts.map",
            "/src/first/bin/first-output.tsbuildinfo"
        ],
        [
            "/src/2/second-output.js",
            "/src/2/second-output.js.map",
            "/src/2/second-output.d.ts",
            "/src/2/second-output.d.ts.map",
            "/src/2/second-output.tsbuildinfo"
        ],
        [
            "/src/third/thirdjs/output/third-output.js",
            "/src/third/thirdjs/output/third-output.js.map",
            "/src/third/thirdjs/output/third-output.d.ts",
            "/src/third/thirdjs/output/third-output.d.ts.map",
            "/src/third/thirdjs/output/third-output.tsbuildinfo"
        ]
    ];
    const relOutputFiles = outputFiles.map(v => v.map(relName)) as [OutputFile, OutputFile, OutputFile];
    type Sources = [string, readonly string[]];
    const enum source {
        config,
        ts
    }
    const enum part {
        one,
        two,
        three
    }
    const sources: [Sources, Sources, Sources] = [
        [
            "/src/first/tsconfig.json",
            [
                "/src/first/first_PART1.ts",
                "/src/first/first_part2.ts",
                "/src/first/first_part3.ts"
            ]
        ],
        [
            "/src/second/tsconfig.json",
            [
                "/src/second/second_part1.ts",
                "/src/second/second_part2.ts"
            ]
        ],
        [
            "/src/third/tsconfig.json",
            [
                "/src/third/third_part1.ts"
            ]
        ]
    ];
    const relSources = sources.map(([config, sources]) => [relName(config), sources.map(relName)]) as any as [Sources, Sources, Sources];
    let initialExpectedDiagnostics: readonly fakes.ExpectedDiagnostic[] = [
        ts.getExpectedDiagnosticForProjectsInBuild(relSources[project.first][source.config], relSources[project.second][source.config], relSources[project.third][source.config]),
        [ts.Diagnostics.Project_0_is_out_of_date_because_output_file_1_does_not_exist, relSources[project.first][source.config], relOutputFiles[project.first][ext.js]],
        [ts.Diagnostics.Building_project_0, sources[project.first][source.config]],
        [ts.Diagnostics.Project_0_is_out_of_date_because_output_file_1_does_not_exist, relSources[project.second][source.config], relOutputFiles[project.second][ext.js]],
        [ts.Diagnostics.Building_project_0, sources[project.second][source.config]],
        [ts.Diagnostics.Project_0_is_out_of_date_because_output_file_1_does_not_exist, relSources[project.third][source.config], relOutputFiles[project.third][ext.js]],
        [ts.Diagnostics.Building_project_0, sources[project.third][source.config]]
    ];
    before(() => {
        outFileFs = ts.loadProjectFromDisk("tests/projects/outfile-concat");
    });
    after(() => {
        outFileFs = undefined!;
        initialExpectedDiagnostics = undefined!;
    });
    function createSolutionBuilder(host: fakes.SolutionBuilderHost, baseOptions?: ts.BuildOptions) {
        return ts.createSolutionBuilder(host, ["/src/third"], { dry: false, force: false, verbose: true, ...(baseOptions || {}) });
    }
    interface VerifyOutFileScenarioInput {
        subScenario: string;
        modifyFs?: (fs: vfs.FileSystem) => void;
        modifyAgainFs?: (fs: vfs.FileSystem) => void;
        ignoreDtsChanged?: true;
        ignoreDtsUnchanged?: true;
        baselineOnly?: true;
    }
    function verifyOutFileScenario({ subScenario, modifyFs, modifyAgainFs, ignoreDtsChanged, ignoreDtsUnchanged, baselineOnly }: VerifyOutFileScenarioInput) {
        const incrementalScenarios: ts.TscIncremental[] = [];
        if (!ignoreDtsChanged) {
            incrementalScenarios.push({
                buildKind: ts.BuildKind.IncrementalDtsChange,
                modifyFs: fs => ts.replaceText(fs, relSources[project.first][source.ts][part.one], "Hello", "Hola"),
            });
        }
        if (!ignoreDtsUnchanged) {
            incrementalScenarios.push({
                buildKind: ts.BuildKind.IncrementalDtsUnchanged,
                modifyFs: fs => ts.appendText(fs, relSources[project.first][source.ts][part.one], "console.log(s);"),
            });
        }
        if (modifyAgainFs) {
            incrementalScenarios.push({
                buildKind: ts.BuildKind.IncrementalHeadersChange,
                modifyFs: modifyAgainFs
            });
        }
        const input: ts.VerifyTsBuildInput = {
            subScenario,
            fs: () => outFileFs,
            scenario: "outfile-concat",
            commandLineArgs: ["--b", "/src/third", "--verbose"],
            baselineSourceMap: true,
            modifyFs,
            baselineReadFileCalls: !baselineOnly,
            incrementalScenarios,
        };
        return incrementalScenarios.length ?
            ts.verifyTscIncrementalEdits(input) :
            ts.verifyTsc(input);
    }
    // Verify initial + incremental edits
    verifyOutFileScenario({
        subScenario: "baseline sectioned sourcemaps",
    });
    // Verify baseline with build info + dts unChanged
    verifyOutFileScenario({
        subScenario: "when final project is not composite but uses project references",
        modifyFs: fs => ts.replaceText(fs, sources[project.third][source.config], `"composite": true,`, ""),
        ignoreDtsChanged: true,
        baselineOnly: true
    });
    // Verify baseline with build info
    verifyOutFileScenario({
        subScenario: "when final project is not composite but incremental",
        modifyFs: fs => ts.replaceText(fs, sources[project.third][source.config], `"composite": true,`, `"incremental": true,`),
        ignoreDtsChanged: true,
        ignoreDtsUnchanged: true,
        baselineOnly: true
    });
    // Verify baseline with build info
    verifyOutFileScenario({
        subScenario: "when final project specifies tsBuildInfoFile",
        modifyFs: fs => ts.replaceText(fs, sources[project.third][source.config], `"composite": true,`, `"composite": true,
        "tsBuildInfoFile": "./thirdjs/output/third.tsbuildinfo",`),
        ignoreDtsChanged: true,
        ignoreDtsUnchanged: true,
        baselineOnly: true
    });
    function getOutFileFsAfterBuild() {
        const fs = outFileFs.shadow();
        const host = fakes.SolutionBuilderHost.create(fs);
        const builder = createSolutionBuilder(host);
        builder.build();
        fs.makeReadonly();
        return fs;
    }
    ts.verifyTscIncrementalEdits({
        scenario: "outFile",
        subScenario: "clean projects",
        fs: getOutFileFsAfterBuild,
        commandLineArgs: ["--b", "/src/third", "--clean"],
        incrementalScenarios: [ts.noChangeRun]
    });
    ts.verifyTsc({
        scenario: "outFile",
        subScenario: "verify buildInfo absence results in new build",
        fs: getOutFileFsAfterBuild,
        commandLineArgs: ["--b", "/src/third", "--verbose"],
        modifyFs: fs => fs.unlinkSync(outputFiles[project.first][ext.buildinfo]),
    });
    ts.verifyTsc({
        scenario: "outFile",
        subScenario: "tsbuildinfo is not generated when incremental is set to false",
        fs: () => outFileFs,
        commandLineArgs: ["--b", "/src/third", "--verbose"],
        modifyFs: fs => ts.replaceText(fs, sources[project.third][source.config], `"composite": true,`, ""),
    });
    it("rebuilds completely when version in tsbuildinfo doesnt match ts version", () => {
        const { fs, tick } = ts.getFsWithTime(outFileFs);
        const host = fakes.SolutionBuilderHost.create(fs);
        let builder = createSolutionBuilder(host);
        builder.build();
        host.assertDiagnosticMessages(...initialExpectedDiagnostics);
        host.clearDiagnostics();
        tick();
        builder = createSolutionBuilder(host);
        ts.changeCompilerVersion(host);
        tick();
        builder.build();
        host.assertDiagnosticMessages(ts.getExpectedDiagnosticForProjectsInBuild(relSources[project.first][source.config], relSources[project.second][source.config], relSources[project.third][source.config]), [ts.Diagnostics.Project_0_is_out_of_date_because_output_for_it_was_generated_with_version_1_that_differs_with_current_version_2, relSources[project.first][source.config], fakes.version, ts.version], [ts.Diagnostics.Building_project_0, sources[project.first][source.config]], [ts.Diagnostics.Project_0_is_out_of_date_because_output_for_it_was_generated_with_version_1_that_differs_with_current_version_2, relSources[project.second][source.config], fakes.version, ts.version], [ts.Diagnostics.Building_project_0, sources[project.second][source.config]], [ts.Diagnostics.Project_0_is_out_of_date_because_output_for_it_was_generated_with_version_1_that_differs_with_current_version_2, relSources[project.third][source.config], fakes.version, ts.version], [ts.Diagnostics.Building_project_0, sources[project.third][source.config]]);
    });
    it("rebuilds completely when command line incremental flag changes between non dts changes", () => {
        const { fs, tick } = ts.getFsWithTime(outFileFs);
        // Make non composite third project
        ts.replaceText(fs, sources[project.third][source.config], `"composite": true,`, "");
        // Build with command line incremental
        const host = fakes.SolutionBuilderHost.create(fs);
        let builder = createSolutionBuilder(host, { incremental: true });
        builder.build();
        host.assertDiagnosticMessages(...initialExpectedDiagnostics);
        host.clearDiagnostics();
        tick();
        // Make non incremental build with change in file that doesnt affect dts
        ts.appendText(fs, relSources[project.first][source.ts][part.one], "console.log(s);");
        builder = createSolutionBuilder(host, { verbose: true });
        builder.build();
        host.assertDiagnosticMessages(ts.getExpectedDiagnosticForProjectsInBuild(relSources[project.first][source.config], relSources[project.second][source.config], relSources[project.third][source.config]), [ts.Diagnostics.Project_0_is_out_of_date_because_oldest_output_1_is_older_than_newest_input_2, relSources[project.first][source.config], relOutputFiles[project.first][ext.js], relSources[project.first][source.ts][part.one]], [ts.Diagnostics.Building_project_0, sources[project.first][source.config]], [ts.Diagnostics.Project_0_is_up_to_date_because_newest_input_1_is_older_than_oldest_output_2, relSources[project.second][source.config], relSources[project.second][source.ts][part.one], relOutputFiles[project.second][ext.js]], [ts.Diagnostics.Project_0_is_out_of_date_because_output_of_its_dependency_1_has_changed, relSources[project.third][source.config], "src/first"], [ts.Diagnostics.Building_project_0, sources[project.third][source.config]]);
        host.clearDiagnostics();
        tick();
        // Make incremental build with change in file that doesnt affect dts
        ts.appendText(fs, relSources[project.first][source.ts][part.one], "console.log(s);");
        builder = createSolutionBuilder(host, { verbose: true, incremental: true });
        builder.build();
        // Builds completely because tsbuildinfo is old.
        host.assertDiagnosticMessages(ts.getExpectedDiagnosticForProjectsInBuild(relSources[project.first][source.config], relSources[project.second][source.config], relSources[project.third][source.config]), [ts.Diagnostics.Project_0_is_out_of_date_because_oldest_output_1_is_older_than_newest_input_2, relSources[project.first][source.config], relOutputFiles[project.first][ext.js], relSources[project.first][source.ts][part.one]], [ts.Diagnostics.Building_project_0, sources[project.first][source.config]], [ts.Diagnostics.Project_0_is_up_to_date_because_newest_input_1_is_older_than_oldest_output_2, relSources[project.second][source.config], relSources[project.second][source.ts][part.one], relOutputFiles[project.second][ext.js]], [ts.Diagnostics.Project_0_is_out_of_date_because_oldest_output_1_is_older_than_newest_input_2, relSources[project.third][source.config], relOutputFiles[project.third][ext.buildinfo], "src/first"], [ts.Diagnostics.Building_project_0, sources[project.third][source.config]]);
        host.clearDiagnostics();
    });
    it("builds till project specified", () => {
        const fs = outFileFs.shadow();
        const host = fakes.SolutionBuilderHost.create(fs);
        const builder = createSolutionBuilder(host, { verbose: false });
        const result = builder.build(sources[project.second][source.config]);
        host.assertDiagnosticMessages( /*empty*/);
        // First and Third is not built
        ts.verifyOutputsAbsent(fs, [...outputFiles[project.first], ...outputFiles[project.third]]);
        // second is built
        ts.verifyOutputsPresent(fs, outputFiles[project.second]);
        assert.equal(result, ts.ExitStatus.Success);
    });
    it("cleans till project specified", () => {
        const fs = outFileFs.shadow();
        const host = fakes.SolutionBuilderHost.create(fs);
        const builder = createSolutionBuilder(host, { verbose: false });
        builder.build();
        const result = builder.clean(sources[project.second][source.config]);
        host.assertDiagnosticMessages( /*empty*/);
        // First and Third output for present
        ts.verifyOutputsPresent(fs, [...outputFiles[project.first], ...outputFiles[project.third]]);
        // second is cleaned
        ts.verifyOutputsAbsent(fs, outputFiles[project.second]);
        assert.equal(result, ts.ExitStatus.Success);
    });
    describe("Prepend output with .tsbuildinfo", () => {
        // Prologues
        describe("Prologues", () => {
            // Verify initial + incremental edits
            verifyOutFileScenario({
                subScenario: "strict in all projects",
                modifyFs: fs => {
                    ts.enableStrict(fs, sources[project.first][source.config]);
                    ts.enableStrict(fs, sources[project.second][source.config]);
                    ts.enableStrict(fs, sources[project.third][source.config]);
                },
                modifyAgainFs: fs => ts.addTestPrologue(fs, relSources[project.first][source.ts][part.one], `"myPrologue"`)
            });
            // Verify ignore dtsChanged
            verifyOutFileScenario({
                subScenario: "strict in one dependency",
                modifyFs: fs => ts.enableStrict(fs, sources[project.second][source.config]),
                modifyAgainFs: fs => ts.addTestPrologue(fs, "src/first/first_PART1.ts", `"myPrologue"`),
                ignoreDtsChanged: true,
                baselineOnly: true
            });
            // Verify initial + incremental edits - sourcemap verification
            verifyOutFileScenario({
                subScenario: "multiple prologues in all projects",
                modifyFs: fs => {
                    ts.enableStrict(fs, sources[project.first][source.config]);
                    ts.addTestPrologue(fs, sources[project.first][source.ts][part.one], `"myPrologue"`);
                    ts.enableStrict(fs, sources[project.second][source.config]);
                    ts.addTestPrologue(fs, sources[project.second][source.ts][part.one], `"myPrologue"`);
                    ts.addTestPrologue(fs, sources[project.second][source.ts][part.two], `"myPrologue2";`);
                    ts.enableStrict(fs, sources[project.third][source.config]);
                    ts.addTestPrologue(fs, sources[project.third][source.ts][part.one], `"myPrologue";`);
                    ts.addTestPrologue(fs, sources[project.third][source.ts][part.one], `"myPrologue3";`);
                },
                modifyAgainFs: fs => ts.addTestPrologue(fs, relSources[project.first][source.ts][part.one], `"myPrologue5"`)
            });
            // Verify ignore dtsChanged
            verifyOutFileScenario({
                subScenario: "multiple prologues in different projects",
                modifyFs: fs => {
                    ts.enableStrict(fs, sources[project.first][source.config]);
                    ts.addTestPrologue(fs, sources[project.second][source.ts][part.one], `"myPrologue"`);
                    ts.addTestPrologue(fs, sources[project.second][source.ts][part.two], `"myPrologue2";`);
                    ts.enableStrict(fs, sources[project.third][source.config]);
                },
                modifyAgainFs: fs => ts.addTestPrologue(fs, sources[project.first][source.ts][part.one], `"myPrologue5"`),
                ignoreDtsChanged: true,
                baselineOnly: true
            });
        });
        // Shebang
        describe("Shebang", () => {
            // changes declaration because its emitted in .d.ts file
            // Verify initial + incremental edits
            verifyOutFileScenario({
                subScenario: "shebang in all projects",
                modifyFs: fs => {
                    ts.addShebang(fs, "first", "first_PART1");
                    ts.addShebang(fs, "first", "first_part2");
                    ts.addShebang(fs, "second", "second_part1");
                    ts.addShebang(fs, "third", "third_part1");
                },
            });
            // Verify ignore dtsChanged
            verifyOutFileScenario({
                subScenario: "shebang in only one dependency project",
                modifyFs: fs => ts.addShebang(fs, "second", "second_part1"),
                ignoreDtsChanged: true,
                baselineOnly: true
            });
        });
        // emitHelpers
        describe("emitHelpers", () => {
            // Verify initial + incremental edits
            verifyOutFileScenario({
                subScenario: "emitHelpers in all projects",
                modifyFs: fs => {
                    ts.addRest(fs, "first", "first_PART1");
                    ts.addRest(fs, "second", "second_part1");
                    ts.addRest(fs, "third", "third_part1");
                },
                modifyAgainFs: fs => ts.removeRest(fs, "first", "first_PART1")
            });
            // Verify ignore dtsChanged
            verifyOutFileScenario({
                subScenario: "emitHelpers in only one dependency project",
                modifyFs: fs => {
                    ts.addStubFoo(fs, "first", "first_PART1");
                    ts.addRest(fs, "second", "second_part1");
                },
                modifyAgainFs: fs => ts.changeStubToRest(fs, "first", "first_PART1"),
                ignoreDtsChanged: true,
                baselineOnly: true
            });
            // Verify ignore dtsChanged
            verifyOutFileScenario({
                subScenario: "multiple emitHelpers in all projects",
                modifyFs: fs => {
                    ts.addRest(fs, "first", "first_PART1");
                    ts.addSpread(fs, "first", "first_part3");
                    ts.addRest(fs, "second", "second_part1");
                    ts.addSpread(fs, "second", "second_part2");
                    ts.addRest(fs, "third", "third_part1");
                    ts.addSpread(fs, "third", "third_part1");
                },
                modifyAgainFs: fs => ts.removeRest(fs, "first", "first_PART1"),
                ignoreDtsChanged: true,
                baselineOnly: true
            });
            // Verify ignore dtsChanged
            verifyOutFileScenario({
                subScenario: "multiple emitHelpers in different projects",
                modifyFs: fs => {
                    ts.addRest(fs, "first", "first_PART1");
                    ts.addSpread(fs, "second", "second_part1");
                    ts.addRest(fs, "third", "third_part1");
                },
                modifyAgainFs: fs => ts.removeRest(fs, "first", "first_PART1"),
                ignoreDtsChanged: true,
                baselineOnly: true
            });
        });
        // triple slash refs
        describe("triple slash refs", () => {
            // changes declaration because its emitted in .d.ts file
            // Verify initial + incremental edits
            verifyOutFileScenario({
                subScenario: "triple slash refs in all projects",
                modifyFs: fs => {
                    ts.addTripleSlashRef(fs, "first", "first_part2");
                    ts.addTripleSlashRef(fs, "second", "second_part1");
                    ts.addTripleSlashRef(fs, "third", "third_part1");
                }
            });
            // Verify ignore dtsChanged
            verifyOutFileScenario({
                subScenario: "triple slash refs in one project",
                modifyFs: fs => ts.addTripleSlashRef(fs, "second", "second_part1"),
                ignoreDtsChanged: true,
                baselineOnly: true
            });
        });
        describe("stripInternal", () => {
            function disableRemoveComments(fs: vfs.FileSystem, file: string) {
                ts.replaceText(fs, file, `"removeComments": true`, `"removeComments": false`);
            }
            function diableRemoveCommentsInAll(fs: vfs.FileSystem) {
                disableRemoveComments(fs, sources[project.first][source.config]);
                disableRemoveComments(fs, sources[project.second][source.config]);
                disableRemoveComments(fs, sources[project.third][source.config]);
            }
            function stripInternalOfThird(fs: vfs.FileSystem) {
                ts.replaceText(fs, sources[project.third][source.config], `"declaration": true,`, `"declaration": true,
"stripInternal": true`);
            }
            function stripInternalScenario(fs: vfs.FileSystem, removeCommentsDisabled?: boolean, jsDocStyle?: boolean) {
                const internal = jsDocStyle ? `/**@internal*/` : `/*@internal*/`;
                if (removeCommentsDisabled) {
                    diableRemoveCommentsInAll(fs);
                }
                stripInternalOfThird(fs);
                ts.replaceText(fs, sources[project.first][source.ts][part.one], "interface", `${internal} interface`);
                ts.appendText(fs, sources[project.second][source.ts][part.one], `
class normalC {
    ${internal} constructor() { }
    ${internal} prop: string;
    ${internal} method() { }
    ${internal} get c() { return 10; }
    ${internal} set c(val: number) { }
}
namespace normalN {
    ${internal} export class C { }
    ${internal} export function foo() {}
    ${internal} export namespace someNamespace { export class C {} }
    ${internal} export namespace someOther.something { export class someClass {} }
    ${internal} export import someImport = someNamespace.C;
    ${internal} export type internalType = internalC;
    ${internal} export const internalConst = 10;
    ${internal} export enum internalEnum { a, b, c }
}
${internal} class internalC {}
${internal} function internalfoo() {}
${internal} namespace internalNamespace { export class someClass {} }
${internal} namespace internalOther.something { export class someClass {} }
${internal} import internalImport = internalNamespace.someClass;
${internal} type internalType = internalC;
${internal} const internalConst = 10;
${internal} enum internalEnum { a, b, c }`);
            }
            // Verify initial + incremental edits
            verifyOutFileScenario({
                subScenario: "stripInternal",
                modifyFs: stripInternalScenario,
                modifyAgainFs: fs => ts.replaceText(fs, sources[project.first][source.ts][part.one], `/*@internal*/ interface`, "interface"),
            });
            // Verify ignore dtsChanged
            verifyOutFileScenario({
                subScenario: "stripInternal with comments emit enabled",
                modifyFs: fs => stripInternalScenario(fs, /*removeCommentsDisabled*/ true),
                modifyAgainFs: fs => ts.replaceText(fs, sources[project.first][source.ts][part.one], `/*@internal*/ interface`, "interface"),
                ignoreDtsChanged: true,
                baselineOnly: true
            });
            // Verify ignore dtsChanged
            verifyOutFileScenario({
                subScenario: "stripInternal jsdoc style comment",
                modifyFs: fs => stripInternalScenario(fs, /*removeCommentsDisabled*/ false, /*jsDocStyle*/ true),
                modifyAgainFs: fs => ts.replaceText(fs, sources[project.first][source.ts][part.one], `/**@internal*/ interface`, "interface"),
                ignoreDtsChanged: true,
                baselineOnly: true
            });
            // Verify ignore dtsChanged
            verifyOutFileScenario({
                subScenario: "stripInternal jsdoc style with comments emit enabled",
                modifyFs: fs => stripInternalScenario(fs, /*removeCommentsDisabled*/ true, /*jsDocStyle*/ true),
                ignoreDtsChanged: true,
                baselineOnly: true
            });
            describe("with three levels of project dependency", () => {
                function makeOneTwoThreeDependOrder(fs: vfs.FileSystem) {
                    ts.replaceText(fs, sources[project.second][source.config], "[", `[
    { "path": "../first", "prepend": true }`);
                    ts.replaceText(fs, sources[project.third][source.config], `{ "path": "../first", "prepend": true },`, "");
                }
                function stripInternalWithDependentOrder(fs: vfs.FileSystem, removeCommentsDisabled?: boolean, jsDocStyle?: boolean) {
                    stripInternalScenario(fs, removeCommentsDisabled, jsDocStyle);
                    makeOneTwoThreeDependOrder(fs);
                }
                // Verify initial + incremental edits
                verifyOutFileScenario({
                    subScenario: "stripInternal when one-two-three are prepended in order",
                    modifyFs: stripInternalWithDependentOrder,
                    modifyAgainFs: fs => ts.replaceText(fs, sources[project.first][source.ts][part.one], `/*@internal*/ interface`, "interface"),
                });
                // Verify ignore dtsChanged
                verifyOutFileScenario({
                    subScenario: "stripInternal with comments emit enabled when one-two-three are prepended in order",
                    modifyFs: fs => stripInternalWithDependentOrder(fs, /*removeCommentsDisabled*/ true),
                    modifyAgainFs: fs => ts.replaceText(fs, sources[project.first][source.ts][part.one], `/*@internal*/ interface`, "interface"),
                    ignoreDtsChanged: true,
                    baselineOnly: true
                });
                // Verify ignore dtsChanged
                verifyOutFileScenario({
                    subScenario: "stripInternal jsdoc style comment when one-two-three are prepended in order",
                    modifyFs: fs => stripInternalWithDependentOrder(fs, /*removeCommentsDisabled*/ false, /*jsDocStyle*/ true),
                    modifyAgainFs: fs => ts.replaceText(fs, sources[project.first][source.ts][part.one], `/**@internal*/ interface`, "interface"),
                    ignoreDtsChanged: true,
                    baselineOnly: true
                });
                // Verify ignore dtsChanged
                verifyOutFileScenario({
                    subScenario: "stripInternal jsdoc style with comments emit enabled when one-two-three are prepended in order",
                    modifyFs: fs => stripInternalWithDependentOrder(fs, /*removeCommentsDisabled*/ true, /*jsDocStyle*/ true),
                    ignoreDtsChanged: true,
                    baselineOnly: true
                });
            });
            // only baseline
            verifyOutFileScenario({
                subScenario: "stripInternal baseline when internal is inside another internal",
                modifyFs: fs => {
                    stripInternalOfThird(fs);
                    ts.prependText(fs, sources[project.first][source.ts][part.one], `namespace ts {
    /* @internal */
    /**
     * Subset of properties from SourceFile that are used in multiple utility functions
     */
    export interface SourceFileLike {
        readonly text: string;
        lineMap?: ReadonlyArray<number>;
        /* @internal */
        getPositionOfLineAndCharacter?(line: number, character: number, allowEdits?: true): number;
    }

    /* @internal */
    export interface RedirectInfo {
        /** Source file this redirects to. */
        readonly redirectTarget: SourceFile;
        /**
         * Source file for the duplicate package. This will not be used by the Program,
         * but we need to keep this around so we can watch for changes in underlying.
         */
        readonly unredirected: SourceFile;
    }

    // Source files are declarations when they are external modules.
    export interface SourceFile {
        someProp: string;
    }
}`);
                },
                ignoreDtsChanged: true,
                ignoreDtsUnchanged: true,
                baselineOnly: true
            });
            // only baseline
            verifyOutFileScenario({
                subScenario: "stripInternal when few members of enum are internal",
                modifyFs: fs => {
                    stripInternalOfThird(fs);
                    ts.prependText(fs, sources[project.first][source.ts][part.one], `enum TokenFlags {
    None = 0,
    /* @internal */
    PrecedingLineBreak = 1 << 0,
    /* @internal */
    PrecedingJSDocComment = 1 << 1,
    /* @internal */
    Unterminated = 1 << 2,
    /* @internal */
    ExtendedUnicodeEscape = 1 << 3,
    Scientific = 1 << 4,
    Octal = 1 << 5,
    HexSpecifier = 1 << 6,
    BinarySpecifier = 1 << 7,
    OctalSpecifier = 1 << 8,
    /* @internal */
    ContainsSeparator = 1 << 9,
    /* @internal */
    BinaryOrOctalSpecifier = BinarySpecifier | OctalSpecifier,
    /* @internal */
    NumericLiteralFlags = Scientific | Octal | HexSpecifier | BinaryOrOctalSpecifier | ContainsSeparator
}
`);
                },
                ignoreDtsChanged: true,
                ignoreDtsUnchanged: true,
                baselineOnly: true
            });
            verifyOutFileScenario({
                subScenario: "stripInternal when prepend is completely internal",
                baselineOnly: true,
                ignoreDtsChanged: true,
                ignoreDtsUnchanged: true,
                modifyFs: fs => {
                    fs.writeFileSync(sources[project.first][source.ts][part.one], "/* @internal */ const A = 1;");
                    fs.writeFileSync(sources[project.third][source.ts][part.one], "const B = 2;");
                    fs.writeFileSync(sources[project.first][source.config], JSON.stringify({
                        compilerOptions: {
                            composite: true,
                            declaration: true,
                            declarationMap: true,
                            skipDefaultLibCheck: true,
                            sourceMap: true,
                            outFile: "./bin/first-output.js"
                        },
                        files: [sources[project.first][source.ts][part.one]]
                    }));
                    fs.writeFileSync(sources[project.third][source.config], JSON.stringify({
                        compilerOptions: {
                            composite: true,
                            declaration: true,
                            declarationMap: false,
                            stripInternal: true,
                            sourceMap: true,
                            outFile: "./thirdjs/output/third-output.js"
                        },
                        references: [{ path: "../first", prepend: true }],
                        files: [sources[project.third][source.ts][part.one]]
                    }));
                }
            });
        });
        describe("empty source files", () => {
            function makeThirdEmptySourceFile(fs: vfs.FileSystem) {
                fs.writeFileSync(sources[project.third][source.ts][part.one], "", "utf8");
            }
            // Verify ignore dtsChanged
            verifyOutFileScenario({
                subScenario: "when source files are empty in the own file",
                modifyFs: makeThirdEmptySourceFile,
                ignoreDtsChanged: true,
                baselineOnly: true
            });
            // only baseline
            verifyOutFileScenario({
                subScenario: "declarationMap and sourceMap disabled",
                modifyFs: fs => {
                    makeThirdEmptySourceFile(fs);
                    ts.replaceText(fs, sources[project.third][source.config], `"composite": true,`, "");
                    ts.replaceText(fs, sources[project.third][source.config], `"sourceMap": true,`, "");
                    ts.replaceText(fs, sources[project.third][source.config], `"declarationMap": true,`, "");
                },
                ignoreDtsChanged: true,
                ignoreDtsUnchanged: true,
                baselineOnly: true
            });
        });
    });
    ts.verifyTsc({
        scenario: "outFile",
        subScenario: "non module projects without prepend",
        fs: () => outFileFs,
        commandLineArgs: ["--b", "/src/third", "--verbose"],
        modifyFs: fs => {
            // No prepend
            ts.replaceText(fs, sources[project.third][source.config], `{ "path": "../first", "prepend": true }`, `{ "path": "../first" }`);
            ts.replaceText(fs, sources[project.third][source.config], `{ "path": "../second", "prepend": true }`, `{ "path": "../second" }`);
            // Non Modules
            ts.replaceText(fs, sources[project.first][source.config], `"composite": true,`, `"composite": true, "module": "none",`);
            ts.replaceText(fs, sources[project.second][source.config], `"composite": true,`, `"composite": true, "module": "none",`);
            ts.replaceText(fs, sources[project.third][source.config], `"composite": true,`, `"composite": true, "module": "none",`);
            // Own file emit
            ts.replaceText(fs, sources[project.first][source.config], `"outFile": "./bin/first-output.js",`, "");
            ts.replaceText(fs, sources[project.second][source.config], `"outFile": "../2/second-output.js",`, "");
            ts.replaceText(fs, sources[project.third][source.config], `"outFile": "./thirdjs/output/third-output.js",`, "");
        },
    });
});
