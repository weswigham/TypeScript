import * as ts from "../../ts";
const aTs: ts.projectSystem.File = {
    path: "/a.ts",
    content: "export const foo = 0;",
};
const bTs: ts.projectSystem.File = {
    path: "/b.ts",
    content: "foo",
};
const tsconfig: ts.projectSystem.File = {
    path: "/tsconfig.json",
    content: "{}",
};
const ambientDeclaration: ts.projectSystem.File = {
    path: "/ambient.d.ts",
    content: "declare module 'ambient' {}"
};
describe("unittests:: tsserver:: importSuggestionsCache", () => {
    it("caches auto-imports in the same file", () => {
        const { importSuggestionsCache, checker } = setup();
        assert.ok(importSuggestionsCache.get(bTs.path, checker));
    });
    it("invalidates the cache when new files are added", () => {
        const { host, importSuggestionsCache, checker } = setup();
        host.reloadFS([aTs, bTs, ambientDeclaration, tsconfig, { ...aTs, path: "/src/a2.ts" }]);
        host.runQueuedTimeoutCallbacks();
        assert.isUndefined(importSuggestionsCache.get(bTs.path, checker));
    });
    it("invalidates the cache when files are deleted", () => {
        const { host, projectService, importSuggestionsCache, checker } = setup();
        projectService.closeClientFile(aTs.path);
        host.reloadFS([bTs, ambientDeclaration, tsconfig]);
        host.runQueuedTimeoutCallbacks();
        assert.isUndefined(importSuggestionsCache.get(bTs.path, checker));
    });
});
function setup() {
    const host = ts.projectSystem.createServerHost([aTs, bTs, ambientDeclaration, tsconfig]);
    const session = ts.projectSystem.createSession(host);
    ts.projectSystem.openFilesForSession([aTs, bTs], session);
    const projectService = session.getProjectService();
    const project = ts.projectSystem.configuredProjectAt(projectService, 0);
    const requestLocation: ts.projectSystem.protocol.FileLocationRequestArgs = {
        file: bTs.path,
        line: 1,
        offset: 3,
    };
    ts.projectSystem.executeSessionRequest<ts.projectSystem.protocol.CompletionsRequest, ts.projectSystem.protocol.CompletionInfoResponse>(session, ts.projectSystem.protocol.CommandTypes.CompletionInfo, {
        ...requestLocation,
        includeExternalModuleExports: true,
        prefix: "foo",
    });
    const checker = project.getLanguageService().getProgram()!.getTypeChecker();
    return { host, project, projectService, importSuggestionsCache: project.getImportSuggestionsCache(), checker };
}
