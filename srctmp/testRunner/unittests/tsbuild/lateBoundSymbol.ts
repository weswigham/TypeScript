import * as ts from "../../ts";
import * as vfs from "../../vfs";
describe("unittests:: tsbuild:: lateBoundSymbol:: interface is merged and contains late bound member", () => {
    let projFs: vfs.FileSystem;
    before(() => {
        projFs = ts.loadProjectFromDisk("tests/projects/lateBoundSymbol");
    });
    after(() => {
        projFs = undefined!; // Release the contents
    });
    ts.verifyTscIncrementalEdits({
        subScenario: "interface is merged and contains late bound member",
        fs: () => projFs,
        scenario: "lateBoundSymbol",
        commandLineArgs: ["--b", "/src/tsconfig.json", "--verbose"],
        incrementalScenarios: [{
                buildKind: ts.BuildKind.IncrementalDtsUnchanged,
                modifyFs: fs => ts.replaceText(fs, "/src/src/main.ts", "const x = 10;", ""),
            }]
    });
});
