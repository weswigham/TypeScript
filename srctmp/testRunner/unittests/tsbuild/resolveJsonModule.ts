import * as ts from "../../ts";
import * as vfs from "../../vfs";
describe("unittests:: tsbuild:: with resolveJsonModule option on project resolveJsonModuleAndComposite", () => {
    let projFs: vfs.FileSystem;
    before(() => {
        projFs = ts.loadProjectFromDisk("tests/projects/resolveJsonModuleAndComposite");
    });
    after(() => {
        projFs = undefined!; // Release the contents
    });
    ts.verifyTsc({
        scenario: "resolveJsonModule",
        subScenario: "include only",
        fs: () => projFs,
        commandLineArgs: ["--b", "/src/tsconfig_withInclude.json"],
    });
    ts.verifyTsc({
        scenario: "resolveJsonModule",
        subScenario: "include of json along with other include",
        fs: () => projFs,
        commandLineArgs: ["--b", "/src/tsconfig_withIncludeOfJson.json"],
    });
    ts.verifyTsc({
        scenario: "resolveJsonModule",
        subScenario: "include of json along with other include and file name matches ts file",
        fs: () => projFs,
        commandLineArgs: ["--b", "/src/tsconfig_withIncludeOfJson.json"],
        modifyFs: fs => {
            fs.rimrafSync("/src/src/hello.json");
            fs.writeFileSync("/src/src/index.json", JSON.stringify({ hello: "world" }));
            fs.writeFileSync("/src/src/index.ts", `import hello from "./index.json"

export default hello.hello`);
        },
    });
    ts.verifyTsc({
        scenario: "resolveJsonModule",
        subScenario: "files containing json file",
        fs: () => projFs,
        commandLineArgs: ["--b", "/src/tsconfig_withFiles.json"],
    });
    ts.verifyTsc({
        scenario: "resolveJsonModule",
        subScenario: "include and files",
        fs: () => projFs,
        commandLineArgs: ["--b", "/src/tsconfig_withIncludeAndFiles.json"],
    });
    ts.verifyTscIncrementalEdits({
        scenario: "resolveJsonModule",
        subScenario: "sourcemap",
        fs: () => projFs,
        commandLineArgs: ["--b", "src/tsconfig_withFiles.json", "--verbose"],
        modifyFs: fs => ts.replaceText(fs, "src/tsconfig_withFiles.json", `"composite": true,`, `"composite": true, "sourceMap": true,`),
        incrementalScenarios: [ts.noChangeRun]
    });
    ts.verifyTscIncrementalEdits({
        scenario: "resolveJsonModule",
        subScenario: "without outDir",
        fs: () => projFs,
        commandLineArgs: ["--b", "src/tsconfig_withFiles.json", "--verbose"],
        modifyFs: fs => ts.replaceText(fs, "src/tsconfig_withFiles.json", `"outDir": "dist",`, ""),
        incrementalScenarios: [ts.noChangeRun]
    });
});
describe("unittests:: tsbuild:: with resolveJsonModule option on project importJsonFromProjectReference", () => {
    let projFs: vfs.FileSystem;
    before(() => {
        projFs = ts.loadProjectFromDisk("tests/projects/importJsonFromProjectReference");
    });
    after(() => {
        projFs = undefined!; // Release the contents
    });
    ts.verifyTscIncrementalEdits({
        scenario: "resolveJsonModule",
        subScenario: "importing json module from project reference",
        fs: () => projFs,
        commandLineArgs: ["--b", "src/tsconfig.json", "--verbose"],
        incrementalScenarios: [ts.noChangeRun]
    });
});
