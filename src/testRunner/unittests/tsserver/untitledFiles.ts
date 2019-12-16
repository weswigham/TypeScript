namespace ts.projectSystem {
    describe("unittests:: tsserver:: Untitled files", () => {
        it("Can convert positions to locations", () => {
            const aTs: ts.projectSystem.File = { path: "/proj/a.ts", content: "" };
            const tsconfig: ts.projectSystem.File = { path: "/proj/tsconfig.json", content: "{}" };
            const session = ts.projectSystem.createSession(ts.projectSystem.createServerHost([aTs, tsconfig]));
            ts.projectSystem.openFilesForSession([aTs], session);
            const untitledFile = "untitled:^Untitled-1";
            ts.projectSystem.executeSessionRequestNoResponse<ts.projectSystem.protocol.OpenRequest>(session, ts.projectSystem.protocol.CommandTypes.Open, {
                file: untitledFile,
                fileContent: `/// <reference path="../../../../../../typings/@epic/Core.d.ts" />\nlet foo = 1;\nfooo/**/`,
                scriptKindName: "TS",
                projectRootPath: "/proj",
            });
            const response = ts.projectSystem.executeSessionRequest<ts.projectSystem.protocol.CodeFixRequest, ts.projectSystem.protocol.CodeFixResponse>(session, ts.projectSystem.protocol.CommandTypes.GetCodeFixes, {
                file: untitledFile,
                startLine: 3,
                startOffset: 1,
                endLine: 3,
                endOffset: 5,
                errorCodes: [ts.Diagnostics.Cannot_find_name_0_Did_you_mean_1.code],
            });
            assert.deepEqual<readonly ts.projectSystem.protocol.CodeFixAction[] | undefined>(response, [
                {
                    description: "Change spelling to 'foo'",
                    fixAllDescription: "Fix all detected spelling errors",
                    fixId: "fixSpelling",
                    fixName: "spelling",
                    changes: [{
                            fileName: untitledFile,
                            textChanges: [{
                                    start: { line: 3, offset: 1 },
                                    end: { line: 3, offset: 5 },
                                    newText: "foo",
                                }],
                        }],
                    commands: undefined,
                },
            ]);
        });
    });
}
