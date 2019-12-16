import * as ts from "../../ts";
import * as vfs from "../../vfs";
describe("unittests:: tsbuild - with noEmitOnError", () => {
    let projFs: vfs.FileSystem;
    before(() => {
        projFs = ts.loadProjectFromDisk("tests/projects/noEmitOnError");
    });
    after(() => {
        projFs = undefined!;
    });
    ts.verifyTsc({
        scenario: "noEmitOnError",
        subScenario: "has empty files diagnostic when files is empty and no references are provided",
        fs: () => projFs,
        commandLineArgs: ["--b", "/src/tsconfig.json"],
    });
});
