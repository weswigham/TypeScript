namespace ts {
    describe("unittests:: tsc:: incremental::", () => {
        ts.verifyTscIncrementalEdits({
            scenario: "incremental",
            subScenario: "when passing filename for buildinfo on commandline",
            fs: () => ts.loadProjectFromFiles({
                "/src/project/src/main.ts": "export const x = 10;",
                "/src/project/tsconfig.json": Utils.dedent `
                    {
                        "compilerOptions": {
                            "target": "es5",
                            "module": "commonjs",
                        },
                        "include": [
                            "src/**/*.ts"
                        ]
                    }`,
            }),
            commandLineArgs: ["--incremental", "--p", "src/project", "--tsBuildInfoFile", "src/project/.tsbuildinfo"],
            incrementalScenarios: [ts.noChangeRun]
        });
        ts.verifyTscIncrementalEdits({
            scenario: "incremental",
            subScenario: "when passing rootDir from commandline",
            fs: () => ts.loadProjectFromFiles({
                "/src/project/src/main.ts": "export const x = 10;",
                "/src/project/tsconfig.json": Utils.dedent `
                    {
                        "compilerOptions": {
                            "incremental": true,
                            "outDir": "dist",
                        },
                    }`,
            }),
            commandLineArgs: ["--p", "src/project", "--rootDir", "src/project/src"],
            incrementalScenarios: [ts.noChangeRun]
        });
        ts.verifyTscIncrementalEdits({
            scenario: "incremental",
            subScenario: "with only dts files",
            fs: () => ts.loadProjectFromFiles({
                "/src/project/src/main.d.ts": "export const x = 10;",
                "/src/project/src/another.d.ts": "export const y = 10;",
                "/src/project/tsconfig.json": "{}",
            }),
            commandLineArgs: ["--incremental", "--p", "src/project"],
            incrementalScenarios: [
                ts.noChangeRun,
                {
                    buildKind: ts.BuildKind.IncrementalDtsUnchanged,
                    modifyFs: fs => ts.appendText(fs, "/src/project/src/main.d.ts", "export const xy = 100;")
                }
            ]
        });
        ts.verifyTscIncrementalEdits({
            scenario: "incremental",
            subScenario: "when passing rootDir is in the tsconfig",
            fs: () => ts.loadProjectFromFiles({
                "/src/project/src/main.ts": "export const x = 10;",
                "/src/project/tsconfig.json": Utils.dedent `
                    {
                        "compilerOptions": {
                            "incremental": true,
                            "outDir": "./built",
                            "rootDir": "./"
                        },
                    }`,
            }),
            commandLineArgs: ["--p", "src/project"],
            incrementalScenarios: [ts.noChangeRun]
        });
        ts.verifyTscIncrementalEdits({
            scenario: "incremental",
            subScenario: "with noEmitOnError",
            fs: () => ts.loadProjectFromDisk("tests/projects/noEmitOnError"),
            commandLineArgs: ["--incremental", "-p", "src"],
            incrementalScenarios: [
                {
                    buildKind: ts.BuildKind.IncrementalDtsUnchanged,
                    modifyFs: fs => fs.writeFileSync("/src/src/main.ts", `import { A } from "../shared/types/db";
const a = {
    lastName: 'sdsd'
};`, "utf-8")
                }
            ]
        });
    });
}
