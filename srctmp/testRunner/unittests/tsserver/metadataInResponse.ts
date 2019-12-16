import * as ts from "../../ts";
import * as Harness from "../../Harness";
describe("unittests:: tsserver:: with metadata in response", () => {
    const metadata = "Extra Info";
    function verifyOutput(host: ts.projectSystem.TestServerHost, expectedResponse: ts.projectSystem.protocol.Response) {
        const output = host.getOutput().map(ts.projectSystem.mapOutputToJson);
        assert.deepEqual(output, [expectedResponse]);
        host.clearOutput();
    }
    function verifyCommandWithMetadata<T extends ts.server.protocol.Request, U = undefined>(session: ts.projectSystem.TestSession, host: ts.projectSystem.TestServerHost, command: Partial<T>, expectedResponseBody: U) {
        command.seq = session.getSeq();
        command.type = "request";
        session.onMessage(JSON.stringify(command));
        verifyOutput(host, expectedResponseBody ?
            { seq: 0, type: "response", command: command.command!, request_seq: command.seq, success: true, body: expectedResponseBody, metadata } :
            { seq: 0, type: "response", command: command.command!, request_seq: command.seq, success: false, message: "No content available." });
    }
    const aTs: ts.projectSystem.File = { path: "/a.ts", content: `class c { prop = "hello"; foo() { return this.prop; } }` };
    const tsconfig: ts.projectSystem.File = {
        path: "/tsconfig.json",
        content: JSON.stringify({
            compilerOptions: { plugins: [{ name: "myplugin" }] }
        })
    };
    function createHostWithPlugin(files: readonly ts.projectSystem.File[]) {
        const host = ts.projectSystem.createServerHost(files);
        host.require = (_initialPath, moduleName) => {
            assert.equal(moduleName, "myplugin");
            return {
                module: () => ({
                    create(info: ts.server.PluginCreateInfo) {
                        const proxy = Harness.LanguageService.makeDefaultProxy(info);
                        proxy.getCompletionsAtPosition = (filename, position, options) => {
                            const result = info.languageService.getCompletionsAtPosition(filename, position, options);
                            if (result) {
                                result.metadata = metadata;
                            }
                            return result;
                        };
                        return proxy;
                    }
                }),
                error: undefined
            };
        };
        return host;
    }
    describe("With completion requests", () => {
        const completionRequestArgs: ts.projectSystem.protocol.CompletionsRequestArgs = {
            file: aTs.path,
            line: 1,
            offset: aTs.content.indexOf("this.") + 1 + "this.".length
        };
        const expectedCompletionEntries: readonly ts.projectSystem.protocol.CompletionEntry[] = [
            { name: "foo", kind: ts.ScriptElementKind.memberFunctionElement, kindModifiers: "", sortText: "0" },
            { name: "prop", kind: ts.ScriptElementKind.memberVariableElement, kindModifiers: "", sortText: "0" }
        ];
        it("can pass through metadata when the command returns array", () => {
            const host = createHostWithPlugin([aTs, tsconfig]);
            const session = ts.projectSystem.createSession(host);
            ts.projectSystem.openFilesForSession([aTs], session);
            verifyCommandWithMetadata<ts.projectSystem.protocol.CompletionsRequest, readonly ts.projectSystem.protocol.CompletionEntry[]>(session, host, {
                command: ts.projectSystem.protocol.CommandTypes.Completions,
                arguments: completionRequestArgs
            }, expectedCompletionEntries);
        });
        it("can pass through metadata when the command returns object", () => {
            const host = createHostWithPlugin([aTs, tsconfig]);
            const session = ts.projectSystem.createSession(host);
            ts.projectSystem.openFilesForSession([aTs], session);
            verifyCommandWithMetadata<ts.projectSystem.protocol.CompletionsRequest, ts.projectSystem.protocol.CompletionInfo>(session, host, {
                command: ts.projectSystem.protocol.CommandTypes.CompletionInfo,
                arguments: completionRequestArgs
            }, {
                isGlobalCompletion: false,
                isMemberCompletion: true,
                isNewIdentifierLocation: false,
                entries: expectedCompletionEntries
            });
        });
        it("returns undefined correctly", () => {
            const aTs: ts.projectSystem.File = { path: "/a.ts", content: `class c { prop = "hello"; foo() { const x = 0; } }` };
            const host = createHostWithPlugin([aTs, tsconfig]);
            const session = ts.projectSystem.createSession(host);
            ts.projectSystem.openFilesForSession([aTs], session);
            verifyCommandWithMetadata<ts.projectSystem.protocol.CompletionsRequest>(session, host, {
                command: ts.projectSystem.protocol.CommandTypes.Completions,
                arguments: { file: aTs.path, line: 1, offset: aTs.content.indexOf("x") + 1 }
            }, /*expectedResponseBody*/ undefined);
        });
    });
});
