import { protocol, File, createServerHost, libFile, createSession, openFilesForSession, makeSessionRequest, CommandNames } from "../../ts.projectSystem";
import { find } from "../../ts";
describe("unittests:: tsserver:: navigate-to for javascript project", () => {
    function containsNavToItem(items: protocol.NavtoItem[], itemName: string, itemKind: string) {
        return find(items, item => item.name === itemName && item.kind === itemKind) !== undefined;
    }
    it("should not include type symbols", () => {
        const file1: File = {
            path: "/a/b/file1.js",
            content: "function foo() {}"
        };
        const configFile: File = {
            path: "/a/b/jsconfig.json",
            content: "{}"
        };
        const host = createServerHost([file1, configFile, libFile]);
        const session = createSession(host);
        openFilesForSession([file1], session);
        // Try to find some interface type defined in lib.d.ts
        const libTypeNavToRequest = makeSessionRequest<protocol.NavtoRequestArgs>(CommandNames.Navto, { searchValue: "Document", file: file1.path, projectFileName: configFile.path });
        const items = (session.executeCommand(libTypeNavToRequest).response as protocol.NavtoItem[]);
        assert.isFalse(containsNavToItem(items, "Document", "interface"), `Found lib.d.ts symbol in JavaScript project nav to request result.`);
        const localFunctionNavToRequst = makeSessionRequest<protocol.NavtoRequestArgs>(CommandNames.Navto, { searchValue: "foo", file: file1.path, projectFileName: configFile.path });
        const items2 = (session.executeCommand(localFunctionNavToRequst).response as protocol.NavtoItem[]);
        assert.isTrue(containsNavToItem(items2, "foo", "function"), `Cannot find function symbol "foo".`);
    });
    it("should de-duplicate symbols", () => {
        const configFile1: File = {
            path: "/a/tsconfig.json",
            content: `{
    "compilerOptions": {
        "composite": true
    }
}`
        };
        const file1: File = {
            path: "/a/index.ts",
            content: "export const abcdef = 1;"
        };
        const configFile2: File = {
            path: "/b/tsconfig.json",
            content: `{
    "compilerOptions": {
        "composite": true
    },
    "references": [
        { "path": "../a" }
    ]
}`
        };
        const file2: File = {
            path: "/b/index.ts",
            content: `import a = require("../a");
export const ghijkl = a.abcdef;`
        };
        const host = createServerHost([configFile1, file1, configFile2, file2]);
        const session = createSession(host);
        openFilesForSession([file1, file2], session);
        const request = makeSessionRequest<protocol.NavtoRequestArgs>(CommandNames.Navto, { searchValue: "abcdef", file: file1.path });
        const items = (session.executeCommand(request).response as protocol.NavtoItem[]);
        assert.strictEqual(items.length, 1);
        const item = items[0];
        assert.strictEqual(item.name, "abcdef");
        assert.strictEqual(item.file, file1.path);
    });
});
