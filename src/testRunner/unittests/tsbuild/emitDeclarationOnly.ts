namespace ts {
    describe("unittests:: tsbuild:: on project with emitDeclarationOnly set to true", () => {
        let projFs: vfs.FileSystem;
        before(() => {
            projFs = ts.loadProjectFromDisk("tests/projects/emitDeclarationOnly");
        });
        after(() => {
            projFs = undefined!;
        });
        function verifyEmitDeclarationOnly(disableMap?: true) {
            ts.verifyTscIncrementalEdits({
                subScenario: `only dts output in circular import project with emitDeclarationOnly${disableMap ? "" : " and declarationMap"}`,
                fs: () => projFs,
                scenario: "emitDeclarationOnly",
                commandLineArgs: ["--b", "/src", "--verbose"],
                modifyFs: disableMap ?
                    (fs => ts.replaceText(fs, "/src/tsconfig.json", `"declarationMap": true,`, "")) :
                    undefined,
                incrementalScenarios: [{
                        buildKind: ts.BuildKind.IncrementalDtsChange,
                        modifyFs: fs => ts.replaceText(fs, "/src/src/a.ts", "b: B;", "b: B; foo: any;"),
                    }],
            });
        }
        verifyEmitDeclarationOnly();
        verifyEmitDeclarationOnly(/*disableMap*/ true);
        ts.verifyTscIncrementalEdits({
            subScenario: `only dts output in non circular imports project with emitDeclarationOnly`,
            fs: () => projFs,
            scenario: "emitDeclarationOnly",
            commandLineArgs: ["--b", "/src", "--verbose"],
            modifyFs: fs => {
                fs.rimrafSync("/src/src/index.ts");
                ts.replaceText(fs, "/src/src/a.ts", `import { B } from "./b";`, `export class B { prop = "hello"; }`);
            },
            incrementalScenarios: [
                {
                    buildKind: ts.BuildKind.IncrementalDtsChange,
                    modifyFs: fs => ts.replaceText(fs, "/src/src/a.ts", "b: B;", "b: B; foo: any;"),
                },
                {
                    buildKind: ts.BuildKind.IncrementalDtsUnchanged,
                    modifyFs: fs => ts.replaceText(fs, "/src/src/a.ts", "export interface A {", `class C { }
export interface A {`),
                },
            ],
        });
    });
}
