namespace ts.server {
    export interface SessionClientHost extends ts.LanguageServiceHost {
        writeMessage(message: string): void;
    }
    interface RenameEntry {
        readonly renameInfo: ts.RenameInfo;
        readonly inputs: {
            readonly fileName: string;
            readonly position: number;
            readonly findInStrings: boolean;
            readonly findInComments: boolean;
        };
        readonly locations: ts.RenameLocation[];
    }
    /* @internal */
    export function extractMessage(message: string): string {
        // Read the content length
        const contentLengthPrefix = "Content-Length: ";
        const lines = message.split(/\r?\n/);
        ts.Debug.assert(lines.length >= 2, "Malformed response: Expected 3 lines in the response.");
        const contentLengthText = lines[0];
        ts.Debug.assert(contentLengthText.indexOf(contentLengthPrefix) === 0, "Malformed response: Response text did not contain content-length header.");
        const contentLength = parseInt(contentLengthText.substring(contentLengthPrefix.length));
        // Read the body
        const responseBody = lines[2];
        // Verify content length
        ts.Debug.assert(responseBody.length + 1 === contentLength, "Malformed response: Content length did not match the response's body length.");
        return responseBody;
    }
    export class SessionClient implements ts.LanguageService {
        private sequence = 0;
        private lineMaps: ts.Map<number[]> = ts.createMap<number[]>();
        private messages: string[] = [];
        private lastRenameEntry: RenameEntry | undefined;
        constructor(private host: SessionClientHost) {
        }
        public onMessage(message: string): void {
            this.messages.push(message);
        }
        private writeMessage(message: string): void {
            this.host.writeMessage(message);
        }
        private getLineMap(fileName: string): number[] {
            let lineMap = this.lineMaps.get(fileName);
            if (!lineMap) {
                lineMap = ts.computeLineStarts(ts.getSnapshotText((this.host.getScriptSnapshot(fileName)!)));
                this.lineMaps.set(fileName, lineMap);
            }
            return lineMap;
        }
        private lineOffsetToPosition(fileName: string, lineOffset: ts.server.protocol.Location, lineMap?: number[]): number {
            lineMap = lineMap || this.getLineMap(fileName);
            return ts.computePositionOfLineAndCharacter(lineMap, lineOffset.line - 1, lineOffset.offset - 1);
        }
        private positionToOneBasedLineOffset(fileName: string, position: number): ts.server.protocol.Location {
            const lineOffset = ts.computeLineAndCharacterOfPosition(this.getLineMap(fileName), position);
            return {
                line: lineOffset.line + 1,
                offset: lineOffset.character + 1
            };
        }
        private convertCodeEditsToTextChange(fileName: string, codeEdit: ts.server.protocol.CodeEdit): ts.TextChange {
            return { span: this.decodeSpan(codeEdit, fileName), newText: codeEdit.newText };
        }
        private processRequest<T extends ts.server.protocol.Request>(command: string, args: T["arguments"]): T {
            const request: ts.server.protocol.Request = {
                seq: this.sequence,
                type: "request",
                arguments: args,
                command
            };
            this.sequence++;
            this.writeMessage(JSON.stringify(request));
            return <T>request;
        }
        private processResponse<T extends ts.server.protocol.Response>(request: ts.server.protocol.Request, expectEmptyBody = false): T {
            let foundResponseMessage = false;
            let response!: T;
            while (!foundResponseMessage) {
                const lastMessage = this.messages.shift()!;
                ts.Debug.assert(!!lastMessage, "Did not receive any responses.");
                const responseBody = extractMessage(lastMessage);
                try {
                    response = JSON.parse(responseBody);
                    // the server may emit events before emitting the response. We
                    // want to ignore these events for testing purpose.
                    if (response.type === "response") {
                        foundResponseMessage = true;
                    }
                }
                catch (e) {
                    throw new Error("Malformed response: Failed to parse server response: " + lastMessage + ". \r\n  Error details: " + e.message);
                }
            }
            // verify the sequence numbers
            ts.Debug.assert(response.request_seq === request.seq, "Malformed response: response sequence number did not match request sequence number.");
            // unmarshal errors
            if (!response.success) {
                throw new Error("Error " + response.message);
            }
            ts.Debug.assert(expectEmptyBody || !!response.body, "Malformed response: Unexpected empty response body.");
            ts.Debug.assert(!expectEmptyBody || !response.body, "Malformed response: Unexpected non-empty response body.");
            return response;
        }
        /*@internal*/
        configure(preferences: ts.UserPreferences) {
            const args: ts.server.protocol.ConfigureRequestArguments = { preferences };
            const request = this.processRequest(ts.server.CommandNames.Configure, args);
            this.processResponse(request, /*expectEmptyBody*/ true);
        }
        openFile(file: string, fileContent?: string, scriptKindName?: "TS" | "JS" | "TSX" | "JSX"): void {
            const args: ts.server.protocol.OpenRequestArgs = { file, fileContent, scriptKindName };
            this.processRequest(ts.server.CommandNames.Open, args);
        }
        closeFile(file: string): void {
            const args: ts.server.protocol.FileRequestArgs = { file };
            this.processRequest(ts.server.CommandNames.Close, args);
        }
        createChangeFileRequestArgs(fileName: string, start: number, end: number, insertString: string): ts.server.protocol.ChangeRequestArgs {
            return { ...this.createFileLocationRequestArgsWithEndLineAndOffset(fileName, start, end), insertString };
        }
        changeFile(fileName: string, args: ts.server.protocol.ChangeRequestArgs): void {
            // clear the line map after an edit
            this.lineMaps.set(fileName, undefined!); // TODO: GH#18217
            this.processRequest(ts.server.CommandNames.Change, args);
        }
        toLineColumnOffset(fileName: string, position: number) {
            const { line, offset } = this.positionToOneBasedLineOffset(fileName, position);
            return { line, character: offset };
        }
        getQuickInfoAtPosition(fileName: string, position: number): ts.QuickInfo {
            const args = this.createFileLocationRequestArgs(fileName, position);
            const request = this.processRequest<ts.server.protocol.QuickInfoRequest>(ts.server.CommandNames.Quickinfo, args);
            const response = this.processResponse<ts.server.protocol.QuickInfoResponse>(request);
            const body = response.body!; // TODO: GH#18217
            return {
                kind: body.kind,
                kindModifiers: body.kindModifiers,
                textSpan: this.decodeSpan(body, fileName),
                displayParts: [{ kind: "text", text: body.displayString }],
                documentation: [{ kind: "text", text: body.documentation }],
                tags: body.tags
            };
        }
        getProjectInfo(file: string, needFileNameList: boolean): ts.server.protocol.ProjectInfo {
            const args: ts.server.protocol.ProjectInfoRequestArgs = { file, needFileNameList };
            const request = this.processRequest<ts.server.protocol.ProjectInfoRequest>(ts.server.CommandNames.ProjectInfo, args);
            const response = this.processResponse<ts.server.protocol.ProjectInfoResponse>(request);
            return {
                configFileName: response.body!.configFileName,
                fileNames: response.body!.fileNames
            };
        }
        getCompletionsAtPosition(fileName: string, position: number, _preferences: ts.UserPreferences | undefined): ts.CompletionInfo {
            // Not passing along 'preferences' because server should already have those from the 'configure' command
            const args: ts.server.protocol.CompletionsRequestArgs = this.createFileLocationRequestArgs(fileName, position);
            const request = this.processRequest<ts.server.protocol.CompletionsRequest>(ts.server.CommandNames.Completions, args);
            const response = this.processResponse<ts.server.protocol.CompletionsResponse>(request);
            return {
                isGlobalCompletion: false,
                isMemberCompletion: false,
                isNewIdentifierLocation: false,
                entries: response.body!.map<ts.CompletionEntry>(entry => {
                    if (entry.replacementSpan !== undefined) {
                        const { name, kind, kindModifiers, sortText, replacementSpan, hasAction, source, isRecommended } = entry;
                        // TODO: GH#241
                        const res: ts.CompletionEntry = { name, kind, kindModifiers, sortText, replacementSpan: this.decodeSpan(replacementSpan, fileName), hasAction, source, isRecommended };
                        return res;
                    }
                    return entry as {
                        name: string;
                        kind: ts.ScriptElementKind;
                        kindModifiers: string;
                        sortText: string;
                    }; // TODO: GH#18217
                })
            };
        }
        getCompletionEntryDetails(fileName: string, position: number, entryName: string, _options: ts.FormatCodeOptions | ts.FormatCodeSettings | undefined, source: string | undefined): ts.CompletionEntryDetails {
            const args: ts.server.protocol.CompletionDetailsRequestArgs = { ...this.createFileLocationRequestArgs(fileName, position), entryNames: [{ name: entryName, source }] };
            const request = this.processRequest<ts.server.protocol.CompletionDetailsRequest>(ts.server.CommandNames.CompletionDetails, args);
            const response = this.processResponse<ts.server.protocol.CompletionDetailsResponse>(request);
            ts.Debug.assert(response.body!.length === 1, "Unexpected length of completion details response body.");
            const convertedCodeActions = ts.map(response.body![0].codeActions, ({ description, changes }) => ({ description, changes: this.convertChanges(changes, fileName) }));
            return { ...response.body![0], codeActions: convertedCodeActions };
        }
        getCompletionEntrySymbol(_fileName: string, _position: number, _entryName: string): ts.Symbol {
            return ts.notImplemented();
        }
        getNavigateToItems(searchValue: string): ts.NavigateToItem[] {
            const args: ts.server.protocol.NavtoRequestArgs = {
                searchValue,
                file: this.host.getScriptFileNames()[0]
            };
            const request = this.processRequest<ts.server.protocol.NavtoRequest>(ts.server.CommandNames.Navto, args);
            const response = this.processResponse<ts.server.protocol.NavtoResponse>(request);
            return response.body!.map(entry => ({
                name: entry.name,
                containerName: entry.containerName || "",
                containerKind: entry.containerKind || ts.ScriptElementKind.unknown,
                kind: entry.kind,
                kindModifiers: entry.kindModifiers || "",
                matchKind: (entry.matchKind as keyof typeof ts.PatternMatchKind),
                isCaseSensitive: entry.isCaseSensitive,
                fileName: entry.file,
                textSpan: this.decodeSpan(entry),
            }));
        }
        getFormattingEditsForRange(file: string, start: number, end: number, _options: ts.FormatCodeOptions): ts.TextChange[] {
            const args: ts.server.protocol.FormatRequestArgs = this.createFileLocationRequestArgsWithEndLineAndOffset(file, start, end);
            // TODO: handle FormatCodeOptions
            const request = this.processRequest<ts.server.protocol.FormatRequest>(ts.server.CommandNames.Format, args);
            const response = this.processResponse<ts.server.protocol.FormatResponse>(request);
            return response.body!.map(entry => this.convertCodeEditsToTextChange(file, entry)); // TODO: GH#18217
        }
        getFormattingEditsForDocument(fileName: string, options: ts.FormatCodeOptions): ts.TextChange[] {
            return this.getFormattingEditsForRange(fileName, 0, this.host.getScriptSnapshot(fileName)!.getLength(), options);
        }
        getFormattingEditsAfterKeystroke(fileName: string, position: number, key: string, _options: ts.FormatCodeOptions): ts.TextChange[] {
            const args: ts.server.protocol.FormatOnKeyRequestArgs = { ...this.createFileLocationRequestArgs(fileName, position), key };
            // TODO: handle FormatCodeOptions
            const request = this.processRequest<ts.server.protocol.FormatOnKeyRequest>(ts.server.CommandNames.Formatonkey, args);
            const response = this.processResponse<ts.server.protocol.FormatResponse>(request);
            return response.body!.map(entry => this.convertCodeEditsToTextChange(fileName, entry)); // TODO: GH#18217
        }
        getDefinitionAtPosition(fileName: string, position: number): ts.DefinitionInfo[] {
            const args: ts.server.protocol.FileLocationRequestArgs = this.createFileLocationRequestArgs(fileName, position);
            const request = this.processRequest<ts.server.protocol.DefinitionRequest>(ts.server.CommandNames.Definition, args);
            const response = this.processResponse<ts.server.protocol.DefinitionResponse>(request);
            return response.body!.map(entry => ({
                containerKind: ts.ScriptElementKind.unknown,
                containerName: "",
                fileName: entry.file,
                textSpan: this.decodeSpan(entry),
                kind: ts.ScriptElementKind.unknown,
                name: ""
            }));
        }
        getDefinitionAndBoundSpan(fileName: string, position: number): ts.DefinitionInfoAndBoundSpan {
            const args: ts.server.protocol.FileLocationRequestArgs = this.createFileLocationRequestArgs(fileName, position);
            const request = this.processRequest<ts.server.protocol.DefinitionRequest>(ts.server.CommandNames.DefinitionAndBoundSpan, args);
            const response = this.processResponse<ts.server.protocol.DefinitionInfoAndBoundSpanResponse>(request);
            const body = ts.Debug.assertDefined(response.body); // TODO: GH#18217
            return {
                definitions: body.definitions.map(entry => ({
                    containerKind: ts.ScriptElementKind.unknown,
                    containerName: "",
                    fileName: entry.file,
                    textSpan: this.decodeSpan(entry),
                    kind: ts.ScriptElementKind.unknown,
                    name: ""
                })),
                textSpan: this.decodeSpan(body.textSpan, request.arguments.file)
            };
        }
        getTypeDefinitionAtPosition(fileName: string, position: number): ts.DefinitionInfo[] {
            const args: ts.server.protocol.FileLocationRequestArgs = this.createFileLocationRequestArgs(fileName, position);
            const request = this.processRequest<ts.server.protocol.TypeDefinitionRequest>(ts.server.CommandNames.TypeDefinition, args);
            const response = this.processResponse<ts.server.protocol.TypeDefinitionResponse>(request);
            return response.body!.map(entry => ({
                containerKind: ts.ScriptElementKind.unknown,
                containerName: "",
                fileName: entry.file,
                textSpan: this.decodeSpan(entry),
                kind: ts.ScriptElementKind.unknown,
                name: ""
            }));
        }
        getImplementationAtPosition(fileName: string, position: number): ts.ImplementationLocation[] {
            const args = this.createFileLocationRequestArgs(fileName, position);
            const request = this.processRequest<ts.server.protocol.ImplementationRequest>(ts.server.CommandNames.Implementation, args);
            const response = this.processResponse<ts.server.protocol.ImplementationResponse>(request);
            return response.body!.map(entry => ({
                fileName: entry.file,
                textSpan: this.decodeSpan(entry),
                kind: ts.ScriptElementKind.unknown,
                displayParts: []
            }));
        }
        findReferences(_fileName: string, _position: number): ts.ReferencedSymbol[] {
            // Not yet implemented.
            return [];
        }
        getReferencesAtPosition(fileName: string, position: number): ts.ReferenceEntry[] {
            const args = this.createFileLocationRequestArgs(fileName, position);
            const request = this.processRequest<ts.server.protocol.ReferencesRequest>(ts.server.CommandNames.References, args);
            const response = this.processResponse<ts.server.protocol.ReferencesResponse>(request);
            return response.body!.refs.map(entry => ({
                fileName: entry.file,
                textSpan: this.decodeSpan(entry),
                isWriteAccess: entry.isWriteAccess,
                isDefinition: entry.isDefinition,
            }));
        }
        getEmitOutput(file: string): ts.EmitOutput {
            const request = this.processRequest<ts.server.protocol.EmitOutputRequest>(ts.server.protocol.CommandTypes.EmitOutput, { file });
            const response = this.processResponse<ts.server.protocol.EmitOutputResponse>(request);
            return response.body;
        }
        getSyntacticDiagnostics(file: string): ts.DiagnosticWithLocation[] {
            return this.getDiagnostics(file, ts.server.CommandNames.SyntacticDiagnosticsSync);
        }
        getSemanticDiagnostics(file: string): ts.Diagnostic[] {
            return this.getDiagnostics(file, ts.server.CommandNames.SemanticDiagnosticsSync);
        }
        getSuggestionDiagnostics(file: string): ts.DiagnosticWithLocation[] {
            return this.getDiagnostics(file, ts.server.CommandNames.SuggestionDiagnosticsSync);
        }
        private getDiagnostics(file: string, command: ts.server.CommandNames): ts.DiagnosticWithLocation[] {
            const request = this.processRequest<ts.server.protocol.SyntacticDiagnosticsSyncRequest | ts.server.protocol.SemanticDiagnosticsSyncRequest | ts.server.protocol.SuggestionDiagnosticsSyncRequest>(command, { file, includeLinePosition: true });
            const response = this.processResponse<ts.server.protocol.SyntacticDiagnosticsSyncResponse | ts.server.protocol.SemanticDiagnosticsSyncResponse | ts.server.protocol.SuggestionDiagnosticsSyncResponse>(request);
            const sourceText = ts.getSnapshotText((this.host.getScriptSnapshot(file)!));
            const fakeSourceFile = ({ fileName: file, text: sourceText } as ts.SourceFile); // Warning! This is a huge lie!
            return (<ts.server.protocol.DiagnosticWithLinePosition[]>response.body).map((entry): ts.DiagnosticWithLocation => {
                const category = ts.firstDefined(Object.keys(ts.DiagnosticCategory), id => ts.isString(id) && entry.category === id.toLowerCase() ? (<any>ts.DiagnosticCategory)[id] : undefined);
                return {
                    file: fakeSourceFile,
                    start: entry.start,
                    length: entry.length,
                    messageText: entry.message,
                    category: ts.Debug.assertDefined(category, "convertDiagnostic: category should not be undefined"),
                    code: entry.code,
                    reportsUnnecessary: entry.reportsUnnecessary,
                };
            });
        }
        getCompilerOptionsDiagnostics(): ts.Diagnostic[] {
            return ts.notImplemented();
        }
        getRenameInfo(fileName: string, position: number, _options?: ts.RenameInfoOptions, findInStrings?: boolean, findInComments?: boolean): ts.RenameInfo {
            // Not passing along 'options' because server should already have those from the 'configure' command
            const args: ts.server.protocol.RenameRequestArgs = { ...this.createFileLocationRequestArgs(fileName, position), findInStrings, findInComments };
            const request = this.processRequest<ts.server.protocol.RenameRequest>(ts.server.CommandNames.Rename, args);
            const response = this.processResponse<ts.server.protocol.RenameResponse>(request);
            const body = response.body!; // TODO: GH#18217
            const locations: ts.RenameLocation[] = [];
            for (const entry of body.locs) {
                const fileName = entry.file;
                for (const { start, end, contextStart, contextEnd, ...prefixSuffixText } of entry.locs) {
                    locations.push({
                        textSpan: this.decodeSpan({ start, end }, fileName),
                        fileName,
                        ...(contextStart !== undefined ?
                            { contextSpan: this.decodeSpan({ start: contextStart, end: contextEnd! }, fileName) } :
                            undefined),
                        ...prefixSuffixText
                    });
                }
            }
            const renameInfo = body.info.canRename
                ? ts.identity<ts.RenameInfoSuccess>({
                    canRename: body.info.canRename,
                    fileToRename: body.info.fileToRename,
                    displayName: body.info.displayName,
                    fullDisplayName: body.info.fullDisplayName,
                    kind: body.info.kind,
                    kindModifiers: body.info.kindModifiers,
                    triggerSpan: ts.createTextSpanFromBounds(position, position),
                })
                : ts.identity<ts.RenameInfoFailure>({ canRename: false, localizedErrorMessage: body.info.localizedErrorMessage });
            this.lastRenameEntry = {
                renameInfo,
                inputs: {
                    fileName,
                    position,
                    findInStrings: !!findInStrings,
                    findInComments: !!findInComments,
                },
                locations,
            };
            return renameInfo;
        }
        getSmartSelectionRange() {
            return ts.notImplemented();
        }
        findRenameLocations(fileName: string, position: number, findInStrings: boolean, findInComments: boolean): ts.RenameLocation[] {
            if (!this.lastRenameEntry ||
                this.lastRenameEntry.inputs.fileName !== fileName ||
                this.lastRenameEntry.inputs.position !== position ||
                this.lastRenameEntry.inputs.findInStrings !== findInStrings ||
                this.lastRenameEntry.inputs.findInComments !== findInComments) {
                this.getRenameInfo(fileName, position, { allowRenameOfImportPath: true }, findInStrings, findInComments);
            }
            return this.lastRenameEntry!.locations;
        }
        private decodeNavigationBarItems(items: ts.server.protocol.NavigationBarItem[] | undefined, fileName: string, lineMap: number[]): ts.NavigationBarItem[] {
            if (!items) {
                return [];
            }
            return items.map(item => ({
                text: item.text,
                kind: item.kind,
                kindModifiers: item.kindModifiers || "",
                spans: item.spans.map(span => this.decodeSpan(span, fileName, lineMap)),
                childItems: this.decodeNavigationBarItems(item.childItems, fileName, lineMap),
                indent: item.indent,
                bolded: false,
                grayed: false
            }));
        }
        getNavigationBarItems(file: string): ts.NavigationBarItem[] {
            const request = this.processRequest<ts.server.protocol.NavBarRequest>(ts.server.CommandNames.NavBar, { file });
            const response = this.processResponse<ts.server.protocol.NavBarResponse>(request);
            const lineMap = this.getLineMap(file);
            return this.decodeNavigationBarItems(response.body, file, lineMap);
        }
        private decodeNavigationTree(tree: ts.server.protocol.NavigationTree, fileName: string, lineMap: number[]): ts.NavigationTree {
            return {
                text: tree.text,
                kind: tree.kind,
                kindModifiers: tree.kindModifiers,
                spans: tree.spans.map(span => this.decodeSpan(span, fileName, lineMap)),
                nameSpan: tree.nameSpan && this.decodeSpan(tree.nameSpan, fileName, lineMap),
                childItems: ts.map(tree.childItems, item => this.decodeNavigationTree(item, fileName, lineMap))
            };
        }
        getNavigationTree(file: string): ts.NavigationTree {
            const request = this.processRequest<ts.server.protocol.NavTreeRequest>(ts.server.CommandNames.NavTree, { file });
            const response = this.processResponse<ts.server.protocol.NavTreeResponse>(request);
            const lineMap = this.getLineMap(file);
            return this.decodeNavigationTree(response.body!, file, lineMap); // TODO: GH#18217
        }
        private decodeSpan(span: ts.server.protocol.TextSpan & {
            file: string;
        }): ts.TextSpan;
        private decodeSpan(span: ts.server.protocol.TextSpan, fileName: string, lineMap?: number[]): ts.TextSpan;
        private decodeSpan(span: ts.server.protocol.TextSpan & {
            file: string;
        }, fileName?: string, lineMap?: number[]): ts.TextSpan {
            fileName = fileName || span.file;
            lineMap = lineMap || this.getLineMap(fileName);
            return ts.createTextSpanFromBounds(this.lineOffsetToPosition(fileName, span.start, lineMap), this.lineOffsetToPosition(fileName, span.end, lineMap));
        }
        getNameOrDottedNameSpan(_fileName: string, _startPos: number, _endPos: number): ts.TextSpan {
            return ts.notImplemented();
        }
        getBreakpointStatementAtPosition(_fileName: string, _position: number): ts.TextSpan {
            return ts.notImplemented();
        }
        getSignatureHelpItems(fileName: string, position: number): ts.SignatureHelpItems | undefined {
            const args: ts.server.protocol.SignatureHelpRequestArgs = this.createFileLocationRequestArgs(fileName, position);
            const request = this.processRequest<ts.server.protocol.SignatureHelpRequest>(ts.server.CommandNames.SignatureHelp, args);
            const response = this.processResponse<ts.server.protocol.SignatureHelpResponse>(request);
            if (!response.body) {
                return undefined;
            }
            const { items, applicableSpan: encodedApplicableSpan, selectedItemIndex, argumentIndex, argumentCount } = response.body;
            const applicableSpan = this.decodeSpan(encodedApplicableSpan, fileName);
            return { items, applicableSpan, selectedItemIndex, argumentIndex, argumentCount };
        }
        getOccurrencesAtPosition(fileName: string, position: number): ts.ReferenceEntry[] {
            const args = this.createFileLocationRequestArgs(fileName, position);
            const request = this.processRequest<ts.server.protocol.OccurrencesRequest>(ts.server.CommandNames.Occurrences, args);
            const response = this.processResponse<ts.server.protocol.OccurrencesResponse>(request);
            return response.body!.map(entry => ({
                fileName: entry.file,
                textSpan: this.decodeSpan(entry),
                isWriteAccess: entry.isWriteAccess,
                isDefinition: false
            }));
        }
        getDocumentHighlights(fileName: string, position: number, filesToSearch: string[]): ts.DocumentHighlights[] {
            const args: ts.server.protocol.DocumentHighlightsRequestArgs = { ...this.createFileLocationRequestArgs(fileName, position), filesToSearch };
            const request = this.processRequest<ts.server.protocol.DocumentHighlightsRequest>(ts.server.CommandNames.DocumentHighlights, args);
            const response = this.processResponse<ts.server.protocol.DocumentHighlightsResponse>(request);
            return response.body!.map(item => ({
                fileName: item.file,
                highlightSpans: item.highlightSpans.map(span => ({
                    textSpan: this.decodeSpan(span, item.file),
                    kind: span.kind
                })),
            }));
        }
        getOutliningSpans(file: string): ts.OutliningSpan[] {
            const request = this.processRequest<ts.server.protocol.OutliningSpansRequest>(ts.server.CommandNames.GetOutliningSpans, { file });
            const response = this.processResponse<ts.server.protocol.OutliningSpansResponse>(request);
            return response.body!.map<ts.OutliningSpan>(item => ({
                textSpan: this.decodeSpan(item.textSpan, file),
                hintSpan: this.decodeSpan(item.hintSpan, file),
                bannerText: item.bannerText,
                autoCollapse: item.autoCollapse,
                kind: item.kind
            }));
        }
        getTodoComments(_fileName: string, _descriptors: ts.TodoCommentDescriptor[]): ts.TodoComment[] {
            return ts.notImplemented();
        }
        getDocCommentTemplateAtPosition(_fileName: string, _position: number): ts.TextInsertion {
            return ts.notImplemented();
        }
        isValidBraceCompletionAtPosition(_fileName: string, _position: number, _openingBrace: number): boolean {
            return ts.notImplemented();
        }
        getJsxClosingTagAtPosition(_fileName: string, _position: number): never {
            return ts.notImplemented();
        }
        getSpanOfEnclosingComment(_fileName: string, _position: number, _onlyMultiLine: boolean): ts.TextSpan {
            return ts.notImplemented();
        }
        getCodeFixesAtPosition(file: string, start: number, end: number, errorCodes: readonly number[]): readonly ts.CodeFixAction[] {
            const args: ts.server.protocol.CodeFixRequestArgs = { ...this.createFileRangeRequestArgs(file, start, end), errorCodes };
            const request = this.processRequest<ts.server.protocol.CodeFixRequest>(ts.server.CommandNames.GetCodeFixes, args);
            const response = this.processResponse<ts.server.protocol.CodeFixResponse>(request);
            return response.body!.map<ts.CodeFixAction>(({ fixName, description, changes, commands, fixId, fixAllDescription }) => // TODO: GH#18217
             ({ fixName, description, changes: this.convertChanges(changes, file), commands: (commands as ts.CodeActionCommand[]), fixId, fixAllDescription }));
        }
        getCombinedCodeFix = ts.notImplemented;
        applyCodeActionCommand = ts.notImplemented;
        private createFileLocationOrRangeRequestArgs(positionOrRange: number | ts.TextRange, fileName: string): ts.server.protocol.FileLocationOrRangeRequestArgs {
            return typeof positionOrRange === "number"
                ? this.createFileLocationRequestArgs(fileName, positionOrRange)
                : this.createFileRangeRequestArgs(fileName, positionOrRange.pos, positionOrRange.end);
        }
        private createFileLocationRequestArgs(file: string, position: number): ts.server.protocol.FileLocationRequestArgs {
            const { line, offset } = this.positionToOneBasedLineOffset(file, position);
            return { file, line, offset };
        }
        private createFileRangeRequestArgs(file: string, start: number, end: number): ts.server.protocol.FileRangeRequestArgs {
            const { line: startLine, offset: startOffset } = this.positionToOneBasedLineOffset(file, start);
            const { line: endLine, offset: endOffset } = this.positionToOneBasedLineOffset(file, end);
            return { file, startLine, startOffset, endLine, endOffset };
        }
        private createFileLocationRequestArgsWithEndLineAndOffset(file: string, start: number, end: number): ts.server.protocol.FileLocationRequestArgs & {
            endLine: number;
            endOffset: number;
        } {
            const { line, offset } = this.positionToOneBasedLineOffset(file, start);
            const { line: endLine, offset: endOffset } = this.positionToOneBasedLineOffset(file, end);
            return { file, line, offset, endLine, endOffset };
        }
        getApplicableRefactors(fileName: string, positionOrRange: number | ts.TextRange): ts.ApplicableRefactorInfo[] {
            const args = this.createFileLocationOrRangeRequestArgs(positionOrRange, fileName);
            const request = this.processRequest<ts.server.protocol.GetApplicableRefactorsRequest>(ts.server.CommandNames.GetApplicableRefactors, args);
            const response = this.processResponse<ts.server.protocol.GetApplicableRefactorsResponse>(request);
            return response.body!; // TODO: GH#18217
        }
        getEditsForRefactor(fileName: string, _formatOptions: ts.FormatCodeSettings, positionOrRange: number | ts.TextRange, refactorName: string, actionName: string): ts.RefactorEditInfo {
            const args = (this.createFileLocationOrRangeRequestArgs(positionOrRange, fileName) as ts.server.protocol.GetEditsForRefactorRequestArgs);
            args.refactor = refactorName;
            args.action = actionName;
            const request = this.processRequest<ts.server.protocol.GetEditsForRefactorRequest>(ts.server.CommandNames.GetEditsForRefactor, args);
            const response = this.processResponse<ts.server.protocol.GetEditsForRefactorResponse>(request);
            if (!response.body) {
                return { edits: [], renameFilename: undefined, renameLocation: undefined };
            }
            const edits: ts.FileTextChanges[] = this.convertCodeEditsToTextChanges(response.body.edits);
            const renameFilename: string | undefined = response.body.renameFilename;
            let renameLocation: number | undefined;
            if (renameFilename !== undefined) {
                renameLocation = this.lineOffsetToPosition(renameFilename, response.body.renameLocation!); // TODO: GH#18217
            }
            return {
                edits,
                renameFilename,
                renameLocation
            };
        }
        organizeImports(_scope: ts.OrganizeImportsScope, _formatOptions: ts.FormatCodeSettings): readonly ts.FileTextChanges[] {
            return ts.notImplemented();
        }
        getEditsForFileRename() {
            return ts.notImplemented();
        }
        private convertCodeEditsToTextChanges(edits: ts.server.protocol.FileCodeEdits[]): ts.FileTextChanges[] {
            return edits.map(edit => {
                const fileName = edit.fileName;
                return {
                    fileName,
                    textChanges: edit.textChanges.map(t => this.convertTextChangeToCodeEdit(t, fileName))
                };
            });
        }
        private convertChanges(changes: ts.server.protocol.FileCodeEdits[], fileName: string): ts.FileTextChanges[] {
            return changes.map(change => ({
                fileName: change.fileName,
                textChanges: change.textChanges.map(textChange => this.convertTextChangeToCodeEdit(textChange, fileName))
            }));
        }
        convertTextChangeToCodeEdit(change: ts.server.protocol.CodeEdit, fileName: string): ts.TextChange {
            return {
                span: this.decodeSpan(change, fileName),
                newText: change.newText ? change.newText : ""
            };
        }
        getBraceMatchingAtPosition(fileName: string, position: number): ts.TextSpan[] {
            const args = this.createFileLocationRequestArgs(fileName, position);
            const request = this.processRequest<ts.server.protocol.BraceRequest>(ts.server.CommandNames.Brace, args);
            const response = this.processResponse<ts.server.protocol.BraceResponse>(request);
            return response.body!.map(entry => this.decodeSpan(entry, fileName)); // TODO: GH#18217
        }
        configurePlugin(pluginName: string, configuration: any): void {
            const request = this.processRequest<ts.server.protocol.ConfigurePluginRequest>("configurePlugin", { pluginName, configuration });
            this.processResponse<ts.server.protocol.ConfigurePluginResponse>(request, /*expectEmptyBody*/ true);
        }
        getIndentationAtPosition(_fileName: string, _position: number, _options: ts.EditorOptions): number {
            return ts.notImplemented();
        }
        getSyntacticClassifications(_fileName: string, _span: ts.TextSpan): ts.ClassifiedSpan[] {
            return ts.notImplemented();
        }
        getSemanticClassifications(_fileName: string, _span: ts.TextSpan): ts.ClassifiedSpan[] {
            return ts.notImplemented();
        }
        getEncodedSyntacticClassifications(_fileName: string, _span: ts.TextSpan): ts.Classifications {
            return ts.notImplemented();
        }
        getEncodedSemanticClassifications(_fileName: string, _span: ts.TextSpan): ts.Classifications {
            return ts.notImplemented();
        }
        getProgram(): ts.Program {
            throw new Error("SourceFile objects are not serializable through the server protocol.");
        }
        getNonBoundSourceFile(_fileName: string): ts.SourceFile {
            throw new Error("SourceFile objects are not serializable through the server protocol.");
        }
        getSourceFile(_fileName: string): ts.SourceFile {
            throw new Error("SourceFile objects are not serializable through the server protocol.");
        }
        cleanupSemanticCache(): void {
            throw new Error("cleanupSemanticCache is not available through the server layer.");
        }
        getSourceMapper(): never {
            return ts.notImplemented();
        }
        dispose(): void {
            throw new Error("dispose is not available through the server layer.");
        }
    }
}
