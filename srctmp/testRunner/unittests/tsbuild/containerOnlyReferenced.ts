import * as ts from "../../ts";
import * as vfs from "../../vfs";
describe("unittests:: tsbuild:: when containerOnly project is referenced", () => {
    let projFs: vfs.FileSystem;
    before(() => {
        projFs = ts.loadProjectFromDisk("tests/projects/containerOnlyReferenced");
    });
    after(() => {
        projFs = undefined!; // Release the contents
    });
    ts.verifyTscIncrementalEdits({
        scenario: "containerOnlyReferenced",
        subScenario: "verify that subsequent builds after initial build doesnt build anything",
        fs: () => projFs,
        commandLineArgs: ["--b", "/src", "--verbose"],
        incrementalScenarios: [ts.noChangeRun]
    });
});
