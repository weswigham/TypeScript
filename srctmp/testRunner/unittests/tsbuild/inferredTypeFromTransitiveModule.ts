import * as ts from "../../ts";
import * as vfs from "../../vfs";
describe("unittests:: tsbuild:: inferredTypeFromTransitiveModule::", () => {
    let projFs: vfs.FileSystem;
    before(() => {
        projFs = ts.loadProjectFromDisk("tests/projects/inferredTypeFromTransitiveModule");
    });
    after(() => {
        projFs = undefined!;
    });
    ts.verifyTscIncrementalEdits({
        scenario: "inferredTypeFromTransitiveModule",
        subScenario: "inferred type from transitive module",
        fs: () => projFs,
        commandLineArgs: ["--b", "/src", "--verbose"],
        incrementalScenarios: [{
                buildKind: ts.BuildKind.IncrementalDtsChange,
                modifyFs: changeBarParam,
            }],
    });
    ts.verifyTscIncrementalEdits({
        subScenario: "inferred type from transitive module with isolatedModules",
        fs: () => projFs,
        scenario: "inferredTypeFromTransitiveModule",
        commandLineArgs: ["--b", "/src", "--verbose"],
        modifyFs: changeToIsolatedModules,
        incrementalScenarios: [{
                buildKind: ts.BuildKind.IncrementalDtsChange,
                modifyFs: changeBarParam
            }]
    });
    ts.verifyTscIncrementalEdits({
        scenario: "inferredTypeFromTransitiveModule",
        subScenario: "reports errors in files affected by change in signature with isolatedModules",
        fs: () => projFs,
        commandLineArgs: ["--b", "/src", "--verbose"],
        modifyFs: fs => {
            changeToIsolatedModules(fs);
            ts.appendText(fs, "/src/lazyIndex.ts", `
import { default as bar } from './bar';
bar("hello");`);
        },
        incrementalScenarios: [{
                buildKind: ts.BuildKind.IncrementalDtsChange,
                modifyFs: changeBarParam
            }]
    });
});
function changeToIsolatedModules(fs: vfs.FileSystem) {
    ts.replaceText(fs, "/src/tsconfig.json", `"incremental": true`, `"incremental": true, "isolatedModules": true`);
}
function changeBarParam(fs: vfs.FileSystem) {
    ts.replaceText(fs, "/src/bar.ts", "param: string", "");
}
