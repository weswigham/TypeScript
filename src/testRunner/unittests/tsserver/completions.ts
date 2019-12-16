namespace ts.projectSystem {
    describe("unittests:: tsserver:: completions", () => {
        it("works", () => {
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
            const session = ts.projectSystem.createSession(ts.projectSystem.createServerHost([aTs, bTs, tsconfig]));
            ts.projectSystem.openFilesForSession([aTs, bTs], session);
            const requestLocation: ts.projectSystem.protocol.FileLocationRequestArgs = {
                file: bTs.path,
                line: 1,
                offset: 3,
            };
            const response = ts.projectSystem.executeSessionRequest<ts.projectSystem.protocol.CompletionsRequest, ts.projectSystem.protocol.CompletionInfoResponse>(session, ts.projectSystem.protocol.CommandTypes.CompletionInfo, {
                ...requestLocation,
                includeExternalModuleExports: true,
                prefix: "foo",
            });
            const entry: ts.projectSystem.protocol.CompletionEntry = {
                hasAction: true,
                insertText: undefined,
                isRecommended: undefined,
                kind: ts.ScriptElementKind.constElement,
                kindModifiers: ts.ScriptElementKindModifier.exportedModifier,
                name: "foo",
                replacementSpan: undefined,
                sortText: ts.Completions.SortText.AutoImportSuggestions,
                source: "/a",
            };
            assert.deepEqual<ts.projectSystem.protocol.CompletionInfo | undefined>(response, {
                isGlobalCompletion: true,
                isMemberCompletion: false,
                isNewIdentifierLocation: false,
                entries: [entry],
            });
            const detailsRequestArgs: ts.projectSystem.protocol.CompletionDetailsRequestArgs = {
                ...requestLocation,
                entryNames: [{ name: "foo", source: "/a" }],
            };
            const detailsResponse = ts.projectSystem.executeSessionRequest<ts.projectSystem.protocol.CompletionDetailsRequest, ts.projectSystem.protocol.CompletionDetailsResponse>(session, ts.projectSystem.protocol.CommandTypes.CompletionDetails, detailsRequestArgs);
            const detailsCommon: ts.projectSystem.protocol.CompletionEntryDetails & ts.CompletionEntryDetails = {
                displayParts: [
                    ts.keywordPart(ts.SyntaxKind.ConstKeyword),
                    ts.spacePart(),
                    ts.displayPart("foo", ts.SymbolDisplayPartKind.localName),
                    ts.punctuationPart(ts.SyntaxKind.ColonToken),
                    ts.spacePart(),
                    ts.displayPart("0", ts.SymbolDisplayPartKind.stringLiteral),
                ],
                documentation: ts.emptyArray,
                kind: ts.ScriptElementKind.constElement,
                kindModifiers: ts.ScriptElementKindModifier.exportedModifier,
                name: "foo",
                source: [{ text: "./a", kind: "text" }],
                tags: undefined,
            };
            assert.deepEqual<readonly ts.projectSystem.protocol.CompletionEntryDetails[] | undefined>(detailsResponse, [
                {
                    codeActions: [
                        {
                            description: `Import 'foo' from module "./a"`,
                            changes: [
                                {
                                    fileName: "/b.ts",
                                    textChanges: [
                                        {
                                            start: { line: 1, offset: 1 },
                                            end: { line: 1, offset: 1 },
                                            newText: 'import { foo } from "./a";\n\n',
                                        },
                                    ],
                                },
                            ],
                            commands: undefined,
                        },
                    ],
                    ...detailsCommon,
                },
            ]);
            interface CompletionDetailsFullRequest extends ts.projectSystem.protocol.FileLocationRequest {
                readonly command: ts.projectSystem.protocol.CommandTypes.CompletionDetailsFull;
                readonly arguments: ts.projectSystem.protocol.CompletionDetailsRequestArgs;
            }
            interface CompletionDetailsFullResponse extends ts.projectSystem.protocol.Response {
                readonly body?: readonly ts.CompletionEntryDetails[];
            }
            const detailsFullResponse = ts.projectSystem.executeSessionRequest<CompletionDetailsFullRequest, CompletionDetailsFullResponse>(session, ts.projectSystem.protocol.CommandTypes.CompletionDetailsFull, detailsRequestArgs);
            assert.deepEqual<readonly ts.CompletionEntryDetails[] | undefined>(detailsFullResponse, [
                {
                    codeActions: [
                        {
                            description: `Import 'foo' from module "./a"`,
                            changes: [
                                {
                                    fileName: "/b.ts",
                                    textChanges: [ts.createTextChange(ts.createTextSpan(0, 0), 'import { foo } from "./a";\n\n')],
                                },
                            ],
                            commands: undefined,
                        }
                    ],
                    ...detailsCommon,
                }
            ]);
        });
    });
}
