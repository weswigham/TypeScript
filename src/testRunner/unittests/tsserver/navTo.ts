namespace ts.projectSystem {
    describe("unittests:: tsserver:: navigate-to for javascript project", () => {
        function containsNavToItem(items: ts.projectSystem.protocol.NavtoItem[], itemName: string, itemKind: string) {
            return ts.find(items, item => item.name === itemName && item.kind === itemKind) !== undefined;
        }
        it("should not include type symbols", () => {
            const file1: ts.projectSystem.File = {
                path: "/a/b/file1.js",
                content: "function foo() {}"
            };
            const configFile: ts.projectSystem.File = {
                path: "/a/b/jsconfig.json",
                content: "{}"
            };
            const host = ts.projectSystem.createServerHost([file1, configFile, ts.projectSystem.libFile]);
            const session = ts.projectSystem.createSession(host);
            ts.projectSystem.openFilesForSession([file1], session);
            // Try to find some interface type defined in lib.d.ts
            const libTypeNavToRequest = ts.projectSystem.makeSessionRequest<ts.projectSystem.protocol.NavtoRequestArgs>(ts.projectSystem.CommandNames.Navto, { searchValue: "Document", file: file1.path, projectFileName: configFile.path });
            const items = (session.executeCommand(libTypeNavToRequest).response as ts.projectSystem.protocol.NavtoItem[]);
            assert.isFalse(containsNavToItem(items, "Document", "interface"), `Found lib.d.ts symbol in JavaScript project nav to request result.`);
            const localFunctionNavToRequst = ts.projectSystem.makeSessionRequest<ts.projectSystem.protocol.NavtoRequestArgs>(ts.projectSystem.CommandNames.Navto, { searchValue: "foo", file: file1.path, projectFileName: configFile.path });
            const items2 = (session.executeCommand(localFunctionNavToRequst).response as ts.projectSystem.protocol.NavtoItem[]);
            assert.isTrue(containsNavToItem(items2, "foo", "function"), `Cannot find function symbol "foo".`);
        });
    });
}
