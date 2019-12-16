import * as ts from "./ts";
declare module "../compiler/types" {
    export interface Node {
        getSourceFile(): ts.SourceFile;
        getChildCount(sourceFile?: ts.SourceFile): number;
        getChildAt(index: number, sourceFile?: ts.SourceFile): ts.Node;
        getChildren(sourceFile?: ts.SourceFile): ts.Node[];
        /* @internal */
        getChildren(sourceFile?: ts.SourceFileLike): ts.Node[]; // eslint-disable-line @typescript-eslint/unified-signatures
        getStart(sourceFile?: ts.SourceFile, includeJsDocComment?: boolean): number;
        /* @internal */
        getStart(sourceFile?: ts.SourceFileLike, includeJsDocComment?: boolean): number; // eslint-disable-line @typescript-eslint/unified-signatures
        getFullStart(): number;
        getEnd(): number;
        getWidth(sourceFile?: ts.SourceFileLike): number;
        getFullWidth(): number;
        getLeadingTriviaWidth(sourceFile?: ts.SourceFile): number;
        getFullText(sourceFile?: ts.SourceFile): string;
        getText(sourceFile?: ts.SourceFile): string;
        getFirstToken(sourceFile?: ts.SourceFile): ts.Node | undefined;
        /* @internal */
        getFirstToken(sourceFile?: ts.SourceFileLike): ts.Node | undefined; // eslint-disable-line @typescript-eslint/unified-signatures
        getLastToken(sourceFile?: ts.SourceFile): ts.Node | undefined;
        /* @internal */
        getLastToken(sourceFile?: ts.SourceFileLike): ts.Node | undefined; // eslint-disable-line @typescript-eslint/unified-signatures
        // See ts.forEachChild for documentation.
        forEachChild<T>(cbNode: (node: ts.Node) => T | undefined, cbNodeArray?: (nodes: ts.NodeArray<ts.Node>) => T | undefined): T | undefined;
    }
}
declare module "../compiler/types" {
    export interface Identifier {
        readonly text: string;
    }
}
declare module "../compiler/types" {
    export interface Symbol {
        readonly name: string;
        getFlags(): ts.SymbolFlags;
        getEscapedName(): ts.__String;
        getName(): string;
        getDeclarations(): ts.Declaration[] | undefined;
        getDocumentationComment(typeChecker: ts.TypeChecker | undefined): SymbolDisplayPart[];
        getJsDocTags(): JSDocTagInfo[];
    }
}
declare module "../compiler/types" {
    export interface Type {
        getFlags(): ts.TypeFlags;
        getSymbol(): ts.Symbol | undefined;
        getProperties(): ts.Symbol[];
        getProperty(propertyName: string): ts.Symbol | undefined;
        getApparentProperties(): ts.Symbol[];
        getCallSignatures(): readonly ts.Signature[];
        getConstructSignatures(): readonly ts.Signature[];
        getStringIndexType(): ts.Type | undefined;
        getNumberIndexType(): ts.Type | undefined;
        getBaseTypes(): ts.BaseType[] | undefined;
        getNonNullableType(): ts.Type;
        /*@internal*/ getNonOptionalType(): ts.Type;
        /*@internal*/ isNullableType(): boolean;
        getConstraint(): ts.Type | undefined;
        getDefault(): ts.Type | undefined;
        isUnion(): this is ts.UnionType;
        isIntersection(): this is ts.IntersectionType;
        isUnionOrIntersection(): this is ts.UnionOrIntersectionType;
        isLiteral(): this is ts.LiteralType;
        isStringLiteral(): this is ts.StringLiteralType;
        isNumberLiteral(): this is ts.NumberLiteralType;
        isTypeParameter(): this is ts.TypeParameter;
        isClassOrInterface(): this is ts.InterfaceType;
        isClass(): this is ts.InterfaceType;
    }
}
declare module "../compiler/types" {
    export interface TypeReference {
        typeArguments?: readonly ts.Type[];
    }
}
declare module "../compiler/types" {
    export interface Signature {
        getDeclaration(): ts.SignatureDeclaration;
        getTypeParameters(): ts.TypeParameter[] | undefined;
        getParameters(): ts.Symbol[];
        getReturnType(): ts.Type;
        getDocumentationComment(typeChecker: ts.TypeChecker | undefined): SymbolDisplayPart[];
        getJsDocTags(): JSDocTagInfo[];
    }
}
declare module "../compiler/types" {
    export interface SourceFile {
        /* @internal */ version: string;
        /* @internal */ scriptSnapshot: IScriptSnapshot | undefined;
        /* @internal */ nameTable: ts.UnderscoreEscapedMap<number> | undefined;
        /* @internal */ getNamedDeclarations(): ts.Map<readonly ts.Declaration[]>;
        getLineAndCharacterOfPosition(pos: number): ts.LineAndCharacter;
        getLineEndOfPosition(pos: number): number;
        getLineStarts(): readonly number[];
        getPositionOfLineAndCharacter(line: number, character: number): number;
        update(newText: string, textChangeRange: ts.TextChangeRange): ts.SourceFile;
        /* @internal */ sourceMapper?: ts.DocumentPositionMapper;
    }
}
declare module "../compiler/types" {
    export interface SourceFileLike {
        getLineAndCharacterOfPosition(pos: number): ts.LineAndCharacter;
    }
}
declare module "../compiler/types" {
    export interface SourceMapSource {
        getLineAndCharacterOfPosition(pos: number): ts.LineAndCharacter;
    }
}
/**
 * Represents an immutable snapshot of a script at a specified time.Once acquired, the
 * snapshot is observably immutable. i.e. the same calls with the same parameters will return
 * the same values.
 */
// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface IScriptSnapshot {
    /** Gets a portion of the script snapshot specified by [start, end). */
    getText(start: number, end: number): string;
    /** Gets the length of this script snapshot. */
    getLength(): number;
    /**
     * Gets the TextChangeRange that describe how the text changed between this text and
     * an older version.  This information is used by the incremental parser to determine
     * what sections of the script need to be re-parsed.  'undefined' can be returned if the
     * change range cannot be determined.  However, in that case, incremental parsing will
     * not happen and the entire document will be re - parsed.
     */
    getChangeRange(oldSnapshot: IScriptSnapshot): ts.TextChangeRange | undefined;
    /** Releases all resources held by this script snapshot */
    dispose?(): void;
}
export namespace ScriptSnapshot {
    class StringScriptSnapshot implements IScriptSnapshot {
        constructor(private text: string) {
        }
        public getText(start: number, end: number): string {
            return start === 0 && end === this.text.length
                ? this.text
                : this.text.substring(start, end);
        }
        public getLength(): number {
            return this.text.length;
        }
        public getChangeRange(): ts.TextChangeRange | undefined {
            // Text-based snapshots do not support incremental parsing. Return undefined
            // to signal that to the caller.
            return undefined;
        }
    }
    export function fromString(text: string): IScriptSnapshot {
        return new StringScriptSnapshot(text);
    }
}
export interface PreProcessedFileInfo {
    referencedFiles: ts.FileReference[];
    typeReferenceDirectives: ts.FileReference[];
    libReferenceDirectives: ts.FileReference[];
    importedFiles: ts.FileReference[];
    ambientExternalModules?: string[];
    isLibFile: boolean;
}
export interface HostCancellationToken {
    isCancellationRequested(): boolean;
}
export interface InstallPackageOptions {
    fileName: ts.Path;
    packageName: string;
}
/* @internal */
export const enum PackageJsonDependencyGroup {
    Dependencies = 1 << 0,
    DevDependencies = 1 << 1,
    PeerDependencies = 1 << 2,
    OptionalDependencies = 1 << 3,
    All = Dependencies | DevDependencies | PeerDependencies | OptionalDependencies
}
/* @internal */
export interface PackageJsonInfo {
    fileName: string;
    dependencies?: ts.Map<string>;
    devDependencies?: ts.Map<string>;
    peerDependencies?: ts.Map<string>;
    optionalDependencies?: ts.Map<string>;
    get(dependencyName: string, inGroups?: PackageJsonDependencyGroup): string | undefined;
    has(dependencyName: string, inGroups?: PackageJsonDependencyGroup): boolean;
}
//
// Public interface of the host of a language service instance.
//
export interface LanguageServiceHost extends ts.ModuleSpecifierResolutionHost {
    getCompilationSettings(): ts.CompilerOptions;
    getNewLine?(): string;
    getProjectVersion?(): string;
    getScriptFileNames(): string[];
    getScriptKind?(fileName: string): ts.ScriptKind;
    getScriptVersion(fileName: string): string;
    getScriptSnapshot(fileName: string): IScriptSnapshot | undefined;
    getProjectReferences?(): readonly ts.ProjectReference[] | undefined;
    getLocalizedDiagnosticMessages?(): any;
    getCancellationToken?(): HostCancellationToken;
    getCurrentDirectory(): string;
    getDefaultLibFileName(options: ts.CompilerOptions): string;
    log?(s: string): void;
    trace?(s: string): void;
    error?(s: string): void;
    /*
     * LS host can optionally implement these methods to support completions for module specifiers.
     * Without these methods, only completions for ambient modules will be provided.
     */
    readDirectory?(path: string, extensions?: readonly string[], exclude?: readonly string[], include?: readonly string[], depth?: number): string[];
    readFile?(path: string, encoding?: string): string | undefined;
    realpath?(path: string): string;
    fileExists?(path: string): boolean;
    /*
     * LS host can optionally implement these methods to support automatic updating when new type libraries are installed
     */
    getTypeRootsVersion?(): number;
    /*
     * LS host can optionally implement this method if it wants to be completely in charge of module name resolution.
     * if implementation is omitted then language service will use built-in module resolution logic and get answers to
     * host specific questions using 'getScriptSnapshot'.
     *
     * If this is implemented, `getResolvedModuleWithFailedLookupLocationsFromCache` should be too.
     */
    resolveModuleNames?(moduleNames: string[], containingFile: string, reusedNames: string[] | undefined, redirectedReference: ts.ResolvedProjectReference | undefined, options: ts.CompilerOptions): (ts.ResolvedModule | undefined)[];
    getResolvedModuleWithFailedLookupLocationsFromCache?(modulename: string, containingFile: string): ts.ResolvedModuleWithFailedLookupLocations | undefined;
    resolveTypeReferenceDirectives?(typeDirectiveNames: string[], containingFile: string, redirectedReference: ts.ResolvedProjectReference | undefined, options: ts.CompilerOptions): (ts.ResolvedTypeReferenceDirective | undefined)[];
    /* @internal */ hasInvalidatedResolution?: ts.HasInvalidatedResolution;
    /* @internal */ hasChangedAutomaticTypeDirectiveNames?: boolean;
    /* @internal */
    getGlobalTypingsCacheLocation?(): string | undefined;
    /*
     * Required for full import and type reference completions.
     * These should be unprefixed names. E.g. `getDirectories("/foo/bar")` should return `["a", "b"]`, not `["/foo/bar/a", "/foo/bar/b"]`.
     */
    getDirectories?(directoryName: string): string[];
    /**
     * Gets a set of custom transformers to use during emit.
     */
    getCustomTransformers?(): ts.CustomTransformers | undefined;
    isKnownTypesPackageName?(name: string): boolean;
    installPackage?(options: InstallPackageOptions): Promise<ApplyCodeActionCommandResult>;
    writeFile?(fileName: string, content: string): void;
    /* @internal */
    getDocumentPositionMapper?(generatedFileName: string, sourceFileName?: string): ts.DocumentPositionMapper | undefined;
    /* @internal */
    getSourceFileLike?(fileName: string): ts.SourceFileLike | undefined;
    /* @internal */
    getPackageJsonsVisibleToFile?(fileName: string, rootDir?: string): readonly PackageJsonInfo[];
    /* @internal */
    getImportSuggestionsCache?(): ts.Completions.ImportSuggestionsForFileCache;
    /* @internal */
    setResolvedProjectReferenceCallbacks?(callbacks: ts.ResolvedProjectReferenceCallbacks): void;
    /* @internal */
    useSourceOfProjectReferenceRedirect?(): boolean;
}
/* @internal */
export const emptyOptions = {};
export type WithMetadata<T> = T & {
    metadata?: unknown;
};
//
// Public services of a language service instance associated
// with a language service host instance
//
export interface LanguageService {
    cleanupSemanticCache(): void;
    getSyntacticDiagnostics(fileName: string): ts.DiagnosticWithLocation[];
    /** The first time this is called, it will return global diagnostics (no location). */
    getSemanticDiagnostics(fileName: string): ts.Diagnostic[];
    getSuggestionDiagnostics(fileName: string): ts.DiagnosticWithLocation[];
    // TODO: Rename this to getProgramDiagnostics to better indicate that these are any
    // diagnostics present for the program level, and not just 'options' diagnostics.
    getCompilerOptionsDiagnostics(): ts.Diagnostic[];
    /**
     * @deprecated Use getEncodedSyntacticClassifications instead.
     */
    getSyntacticClassifications(fileName: string, span: ts.TextSpan): ClassifiedSpan[];
    /**
     * @deprecated Use getEncodedSemanticClassifications instead.
     */
    getSemanticClassifications(fileName: string, span: ts.TextSpan): ClassifiedSpan[];
    // Encoded as triples of [start, length, ClassificationType].
    getEncodedSyntacticClassifications(fileName: string, span: ts.TextSpan): Classifications;
    getEncodedSemanticClassifications(fileName: string, span: ts.TextSpan): Classifications;
    getCompletionsAtPosition(fileName: string, position: number, options: GetCompletionsAtPositionOptions | undefined): WithMetadata<CompletionInfo> | undefined;
    // "options" and "source" are optional only for backwards-compatibility
    getCompletionEntryDetails(fileName: string, position: number, name: string, formatOptions: FormatCodeOptions | FormatCodeSettings | undefined, source: string | undefined, preferences: ts.UserPreferences | undefined): CompletionEntryDetails | undefined;
    getCompletionEntrySymbol(fileName: string, position: number, name: string, source: string | undefined): ts.Symbol | undefined;
    getQuickInfoAtPosition(fileName: string, position: number): QuickInfo | undefined;
    getNameOrDottedNameSpan(fileName: string, startPos: number, endPos: number): ts.TextSpan | undefined;
    getBreakpointStatementAtPosition(fileName: string, position: number): ts.TextSpan | undefined;
    getSignatureHelpItems(fileName: string, position: number, options: SignatureHelpItemsOptions | undefined): SignatureHelpItems | undefined;
    getRenameInfo(fileName: string, position: number, options?: RenameInfoOptions): RenameInfo;
    findRenameLocations(fileName: string, position: number, findInStrings: boolean, findInComments: boolean, providePrefixAndSuffixTextForRename?: boolean): readonly RenameLocation[] | undefined;
    getSmartSelectionRange(fileName: string, position: number): SelectionRange;
    getDefinitionAtPosition(fileName: string, position: number): readonly DefinitionInfo[] | undefined;
    getDefinitionAndBoundSpan(fileName: string, position: number): DefinitionInfoAndBoundSpan | undefined;
    getTypeDefinitionAtPosition(fileName: string, position: number): readonly DefinitionInfo[] | undefined;
    getImplementationAtPosition(fileName: string, position: number): readonly ImplementationLocation[] | undefined;
    getReferencesAtPosition(fileName: string, position: number): ReferenceEntry[] | undefined;
    findReferences(fileName: string, position: number): ReferencedSymbol[] | undefined;
    getDocumentHighlights(fileName: string, position: number, filesToSearch: string[]): ts.DocumentHighlights[] | undefined;
    /** @deprecated */
    getOccurrencesAtPosition(fileName: string, position: number): readonly ReferenceEntry[] | undefined;
    getNavigateToItems(searchValue: string, maxResultCount?: number, fileName?: string, excludeDtsFiles?: boolean): NavigateToItem[];
    getNavigationBarItems(fileName: string): NavigationBarItem[];
    getNavigationTree(fileName: string): NavigationTree;
    getOutliningSpans(fileName: string): OutliningSpan[];
    getTodoComments(fileName: string, descriptors: TodoCommentDescriptor[]): TodoComment[];
    getBraceMatchingAtPosition(fileName: string, position: number): ts.TextSpan[];
    getIndentationAtPosition(fileName: string, position: number, options: EditorOptions | EditorSettings): number;
    getFormattingEditsForRange(fileName: string, start: number, end: number, options: FormatCodeOptions | FormatCodeSettings): TextChange[];
    getFormattingEditsForDocument(fileName: string, options: FormatCodeOptions | FormatCodeSettings): TextChange[];
    getFormattingEditsAfterKeystroke(fileName: string, position: number, key: string, options: FormatCodeOptions | FormatCodeSettings): TextChange[];
    getDocCommentTemplateAtPosition(fileName: string, position: number): TextInsertion | undefined;
    isValidBraceCompletionAtPosition(fileName: string, position: number, openingBrace: number): boolean;
    /**
     * This will return a defined result if the position is after the `>` of the opening tag, or somewhere in the text, of a JSXElement with no closing tag.
     * Editors should call this after `>` is typed.
     */
    getJsxClosingTagAtPosition(fileName: string, position: number): JsxClosingTagInfo | undefined;
    getSpanOfEnclosingComment(fileName: string, position: number, onlyMultiLine: boolean): ts.TextSpan | undefined;
    toLineColumnOffset?(fileName: string, position: number): ts.LineAndCharacter;
    /** @internal */
    getSourceMapper(): ts.SourceMapper;
    getCodeFixesAtPosition(fileName: string, start: number, end: number, errorCodes: readonly number[], formatOptions: FormatCodeSettings, preferences: ts.UserPreferences): readonly CodeFixAction[];
    getCombinedCodeFix(scope: CombinedCodeFixScope, fixId: {}, formatOptions: FormatCodeSettings, preferences: ts.UserPreferences): CombinedCodeActions;
    applyCodeActionCommand(action: CodeActionCommand, formatSettings?: FormatCodeSettings): Promise<ApplyCodeActionCommandResult>;
    applyCodeActionCommand(action: CodeActionCommand[], formatSettings?: FormatCodeSettings): Promise<ApplyCodeActionCommandResult[]>;
    applyCodeActionCommand(action: CodeActionCommand | CodeActionCommand[], formatSettings?: FormatCodeSettings): Promise<ApplyCodeActionCommandResult | ApplyCodeActionCommandResult[]>;
    /** @deprecated `fileName` will be ignored */
    applyCodeActionCommand(fileName: string, action: CodeActionCommand): Promise<ApplyCodeActionCommandResult>;
    /** @deprecated `fileName` will be ignored */
    applyCodeActionCommand(fileName: string, action: CodeActionCommand[]): Promise<ApplyCodeActionCommandResult[]>;
    /** @deprecated `fileName` will be ignored */
    applyCodeActionCommand(fileName: string, action: CodeActionCommand | CodeActionCommand[]): Promise<ApplyCodeActionCommandResult | ApplyCodeActionCommandResult[]>;
    getApplicableRefactors(fileName: string, positionOrRange: number | ts.TextRange, preferences: ts.UserPreferences | undefined): ApplicableRefactorInfo[];
    getEditsForRefactor(fileName: string, formatOptions: FormatCodeSettings, positionOrRange: number | ts.TextRange, refactorName: string, actionName: string, preferences: ts.UserPreferences | undefined): RefactorEditInfo | undefined;
    organizeImports(scope: OrganizeImportsScope, formatOptions: FormatCodeSettings, preferences: ts.UserPreferences | undefined): readonly FileTextChanges[];
    getEditsForFileRename(oldFilePath: string, newFilePath: string, formatOptions: FormatCodeSettings, preferences: ts.UserPreferences | undefined): readonly FileTextChanges[];
    getEmitOutput(fileName: string, emitOnlyDtsFiles?: boolean, forceDtsEmit?: boolean): ts.EmitOutput;
    getProgram(): ts.Program | undefined;
    /* @internal */ getNonBoundSourceFile(fileName: string): ts.SourceFile;
    dispose(): void;
}
export interface JsxClosingTagInfo {
    readonly newText: string;
}
export interface CombinedCodeFixScope {
    type: "file";
    fileName: string;
}
export type OrganizeImportsScope = CombinedCodeFixScope;
export type CompletionsTriggerCharacter = "." | '"' | "'" | "`" | "/" | "@" | "<";
export interface GetCompletionsAtPositionOptions extends ts.UserPreferences {
    /**
     * If the editor is asking for completions because a certain character was typed
     * (as opposed to when the user explicitly requested them) this should be set.
     */
    triggerCharacter?: CompletionsTriggerCharacter;
    /** @deprecated Use includeCompletionsForModuleExports */
    includeExternalModuleExports?: boolean;
    /** @deprecated Use includeCompletionsWithInsertText */
    includeInsertTextCompletions?: boolean;
}
export type SignatureHelpTriggerCharacter = "," | "(" | "<";
export type SignatureHelpRetriggerCharacter = SignatureHelpTriggerCharacter | ")";
export interface SignatureHelpItemsOptions {
    triggerReason?: SignatureHelpTriggerReason;
}
export type SignatureHelpTriggerReason = SignatureHelpInvokedReason | SignatureHelpCharacterTypedReason | SignatureHelpRetriggeredReason;
/**
 * Signals that the user manually requested signature help.
 * The language service will unconditionally attempt to provide a result.
 */
export interface SignatureHelpInvokedReason {
    kind: "invoked";
    triggerCharacter?: undefined;
}
/**
 * Signals that the signature help request came from a user typing a character.
 * Depending on the character and the syntactic context, the request may or may not be served a result.
 */
export interface SignatureHelpCharacterTypedReason {
    kind: "characterTyped";
    /**
     * Character that was responsible for triggering signature help.
     */
    triggerCharacter: SignatureHelpTriggerCharacter;
}
/**
 * Signals that this signature help request came from typing a character or moving the cursor.
 * This should only occur if a signature help session was already active and the editor needs to see if it should adjust.
 * The language service will unconditionally attempt to provide a result.
 * `triggerCharacter` can be `undefined` for a retrigger caused by a cursor move.
 */
export interface SignatureHelpRetriggeredReason {
    kind: "retrigger";
    /**
     * Character that was responsible for triggering signature help.
     */
    triggerCharacter?: SignatureHelpRetriggerCharacter;
}
export interface ApplyCodeActionCommandResult {
    successMessage: string;
}
export interface Classifications {
    spans: number[];
    endOfLineState: EndOfLineState;
}
export interface ClassifiedSpan {
    textSpan: ts.TextSpan;
    classificationType: ClassificationTypeNames;
}
/**
 * Navigation bar interface designed for visual studio's dual-column layout.
 * This does not form a proper tree.
 * The navbar is returned as a list of top-level items, each of which has a list of child items.
 * Child items always have an empty array for their `childItems`.
 */
export interface NavigationBarItem {
    text: string;
    kind: ScriptElementKind;
    kindModifiers: string;
    spans: ts.TextSpan[];
    childItems: NavigationBarItem[];
    indent: number;
    bolded: boolean;
    grayed: boolean;
}
/**
 * Node in a tree of nested declarations in a file.
 * The top node is always a script or module node.
 */
export interface NavigationTree {
    /** Name of the declaration, or a short description, e.g. "<class>". */
    text: string;
    kind: ScriptElementKind;
    /** ScriptElementKindModifier separated by commas, e.g. "public,abstract" */
    kindModifiers: string;
    /**
     * Spans of the nodes that generated this declaration.
     * There will be more than one if this is the result of merging.
     */
    spans: ts.TextSpan[];
    nameSpan: ts.TextSpan | undefined;
    /** Present if non-empty */
    childItems?: NavigationTree[];
}
export interface TodoCommentDescriptor {
    text: string;
    priority: number;
}
export interface TodoComment {
    descriptor: TodoCommentDescriptor;
    message: string;
    position: number;
}
export interface TextChange {
    span: ts.TextSpan;
    newText: string;
}
export interface FileTextChanges {
    fileName: string;
    textChanges: readonly TextChange[];
    isNewFile?: boolean;
}
export interface CodeAction {
    /** Description of the code action to display in the UI of the editor */
    description: string;
    /** Text changes to apply to each file as part of the code action */
    changes: FileTextChanges[];
    /**
     * If the user accepts the code fix, the editor should send the action back in a `applyAction` request.
     * This allows the language service to have side effects (e.g. installing dependencies) upon a code fix.
     */
    commands?: CodeActionCommand[];
}
export interface CodeFixAction extends CodeAction {
    /** Short name to identify the fix, for use by telemetry. */
    fixName: string;
    /**
     * If present, one may call 'getCombinedCodeFix' with this fixId.
     * This may be omitted to indicate that the code fix can't be applied in a group.
     */
    fixId?: {};
    fixAllDescription?: string;
}
export interface CombinedCodeActions {
    changes: readonly FileTextChanges[];
    commands?: readonly CodeActionCommand[];
}
// Publicly, this type is just `{}`. Internally it is a union of all the actions we use.
// See `commands?: {}[]` in protocol.ts
export type CodeActionCommand = InstallPackageAction;
export interface InstallPackageAction {
    /* @internal */ readonly type: "install package";
    /* @internal */ readonly file: string;
    /* @internal */ readonly packageName: string;
}
/**
 * A set of one or more available refactoring actions, grouped under a parent refactoring.
 */
export interface ApplicableRefactorInfo {
    /**
     * The programmatic name of the refactoring
     */
    name: string;
    /**
     * A description of this refactoring category to show to the user.
     * If the refactoring gets inlined (see below), this text will not be visible.
     */
    description: string;
    /**
     * Inlineable refactorings can have their actions hoisted out to the top level
     * of a context menu. Non-inlineanable refactorings should always be shown inside
     * their parent grouping.
     *
     * If not specified, this value is assumed to be 'true'
     */
    inlineable?: boolean;
    actions: RefactorActionInfo[];
}
/**
 * Represents a single refactoring action - for example, the "Extract Method..." refactor might
 * offer several actions, each corresponding to a surround class or closure to extract into.
 */
export interface RefactorActionInfo {
    /**
     * The programmatic name of the refactoring action
     */
    name: string;
    /**
     * A description of this refactoring action to show to the user.
     * If the parent refactoring is inlined away, this will be the only text shown,
     * so this description should make sense by itself if the parent is inlineable=true
     */
    description: string;
}
/**
 * A set of edits to make in response to a refactor action, plus an optional
 * location where renaming should be invoked from
 */
export interface RefactorEditInfo {
    edits: FileTextChanges[];
    renameFilename?: string;
    renameLocation?: number;
    commands?: CodeActionCommand[];
}
export interface TextInsertion {
    newText: string;
    /** The position in newText the caret should point to after the insertion. */
    caretOffset: number;
}
export interface DocumentSpan {
    textSpan: ts.TextSpan;
    fileName: string;
    /**
     * If the span represents a location that was remapped (e.g. via a .d.ts.map file),
     * then the original filename and span will be specified here
     */
    originalTextSpan?: ts.TextSpan;
    originalFileName?: string;
    /**
     * If DocumentSpan.textSpan is the span for name of the declaration,
     * then this is the span for relevant declaration
     */
    contextSpan?: ts.TextSpan;
    originalContextSpan?: ts.TextSpan;
}
export interface RenameLocation extends DocumentSpan {
    readonly prefixText?: string;
    readonly suffixText?: string;
}
export interface ReferenceEntry extends DocumentSpan {
    isWriteAccess: boolean;
    isDefinition: boolean;
    isInString?: true;
}
export interface ImplementationLocation extends DocumentSpan {
    kind: ScriptElementKind;
    displayParts: SymbolDisplayPart[];
}
export const enum HighlightSpanKind {
    none = "none",
    definition = "definition",
    reference = "reference",
    writtenReference = "writtenReference"
}
export interface HighlightSpan {
    fileName?: string;
    isInString?: true;
    textSpan: ts.TextSpan;
    contextSpan?: ts.TextSpan;
    kind: HighlightSpanKind;
}
export interface NavigateToItem {
    name: string;
    kind: ScriptElementKind;
    kindModifiers: string;
    matchKind: "exact" | "prefix" | "substring" | "camelCase";
    isCaseSensitive: boolean;
    fileName: string;
    textSpan: ts.TextSpan;
    containerName: string;
    containerKind: ScriptElementKind;
}
export enum IndentStyle {
    None = 0,
    Block = 1,
    Smart = 2
}
export enum SemicolonPreference {
    Ignore = "ignore",
    Insert = "insert",
    Remove = "remove"
}
/* @deprecated - consider using EditorSettings instead */
export interface EditorOptions {
    BaseIndentSize?: number;
    IndentSize: number;
    TabSize: number;
    NewLineCharacter: string;
    ConvertTabsToSpaces: boolean;
    IndentStyle: IndentStyle;
}
// TODO: GH#18217 These are frequently asserted as defined
export interface EditorSettings {
    baseIndentSize?: number;
    indentSize?: number;
    tabSize?: number;
    newLineCharacter?: string;
    convertTabsToSpaces?: boolean;
    indentStyle?: IndentStyle;
}
/* @deprecated - consider using FormatCodeSettings instead */
export interface FormatCodeOptions extends EditorOptions {
    InsertSpaceAfterCommaDelimiter: boolean;
    InsertSpaceAfterSemicolonInForStatements: boolean;
    InsertSpaceBeforeAndAfterBinaryOperators: boolean;
    InsertSpaceAfterConstructor?: boolean;
    InsertSpaceAfterKeywordsInControlFlowStatements: boolean;
    InsertSpaceAfterFunctionKeywordForAnonymousFunctions: boolean;
    InsertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: boolean;
    InsertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: boolean;
    InsertSpaceAfterOpeningAndBeforeClosingNonemptyBraces?: boolean;
    InsertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces: boolean;
    InsertSpaceAfterOpeningAndBeforeClosingJsxExpressionBraces?: boolean;
    InsertSpaceAfterTypeAssertion?: boolean;
    InsertSpaceBeforeFunctionParenthesis?: boolean;
    PlaceOpenBraceOnNewLineForFunctions: boolean;
    PlaceOpenBraceOnNewLineForControlBlocks: boolean;
    insertSpaceBeforeTypeAnnotation?: boolean;
}
export interface FormatCodeSettings extends EditorSettings {
    readonly insertSpaceAfterCommaDelimiter?: boolean;
    readonly insertSpaceAfterSemicolonInForStatements?: boolean;
    readonly insertSpaceBeforeAndAfterBinaryOperators?: boolean;
    readonly insertSpaceAfterConstructor?: boolean;
    readonly insertSpaceAfterKeywordsInControlFlowStatements?: boolean;
    readonly insertSpaceAfterFunctionKeywordForAnonymousFunctions?: boolean;
    readonly insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis?: boolean;
    readonly insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets?: boolean;
    readonly insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces?: boolean;
    readonly insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces?: boolean;
    readonly insertSpaceAfterOpeningAndBeforeClosingJsxExpressionBraces?: boolean;
    readonly insertSpaceAfterTypeAssertion?: boolean;
    readonly insertSpaceBeforeFunctionParenthesis?: boolean;
    readonly placeOpenBraceOnNewLineForFunctions?: boolean;
    readonly placeOpenBraceOnNewLineForControlBlocks?: boolean;
    readonly insertSpaceBeforeTypeAnnotation?: boolean;
    readonly indentMultiLineObjectLiteralBeginningOnBlankLine?: boolean;
    readonly semicolons?: SemicolonPreference;
}
export function getDefaultFormatCodeSettings(newLineCharacter?: string): FormatCodeSettings {
    return {
        indentSize: 4,
        tabSize: 4,
        newLineCharacter: newLineCharacter || "\n",
        convertTabsToSpaces: true,
        indentStyle: IndentStyle.Smart,
        insertSpaceAfterConstructor: false,
        insertSpaceAfterCommaDelimiter: true,
        insertSpaceAfterSemicolonInForStatements: true,
        insertSpaceBeforeAndAfterBinaryOperators: true,
        insertSpaceAfterKeywordsInControlFlowStatements: true,
        insertSpaceAfterFunctionKeywordForAnonymousFunctions: false,
        insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: false,
        insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: false,
        insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces: true,
        insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces: false,
        insertSpaceAfterOpeningAndBeforeClosingJsxExpressionBraces: false,
        insertSpaceBeforeFunctionParenthesis: false,
        placeOpenBraceOnNewLineForFunctions: false,
        placeOpenBraceOnNewLineForControlBlocks: false,
        semicolons: SemicolonPreference.Ignore,
    };
}
/* @internal */
export const testFormatSettings = getDefaultFormatCodeSettings("\n");
export interface DefinitionInfo extends DocumentSpan {
    kind: ScriptElementKind;
    name: string;
    containerKind: ScriptElementKind;
    containerName: string;
    /* @internal */ isLocal?: boolean;
}
export interface DefinitionInfoAndBoundSpan {
    definitions?: readonly DefinitionInfo[];
    textSpan: ts.TextSpan;
}
export interface ReferencedSymbolDefinitionInfo extends DefinitionInfo {
    displayParts: SymbolDisplayPart[];
}
export interface ReferencedSymbol {
    definition: ReferencedSymbolDefinitionInfo;
    references: ReferenceEntry[];
}
export enum SymbolDisplayPartKind {
    aliasName,
    className,
    enumName,
    fieldName,
    interfaceName,
    keyword,
    lineBreak,
    numericLiteral,
    stringLiteral,
    localName,
    methodName,
    moduleName,
    operator,
    parameterName,
    propertyName,
    punctuation,
    space,
    text,
    typeParameterName,
    enumMemberName,
    functionName,
    regularExpressionLiteral
}
export interface SymbolDisplayPart {
    text: string;
    kind: string;
}
export interface JSDocTagInfo {
    name: string;
    text?: string;
}
export interface QuickInfo {
    kind: ScriptElementKind;
    kindModifiers: string;
    textSpan: ts.TextSpan;
    displayParts?: SymbolDisplayPart[];
    documentation?: SymbolDisplayPart[];
    tags?: JSDocTagInfo[];
}
export type RenameInfo = RenameInfoSuccess | RenameInfoFailure;
export interface RenameInfoSuccess {
    canRename: true;
    /**
     * File or directory to rename.
     * If set, `getEditsForFileRename` should be called instead of `findRenameLocations`.
     */
    fileToRename?: string;
    displayName: string;
    fullDisplayName: string;
    kind: ScriptElementKind;
    kindModifiers: string;
    triggerSpan: ts.TextSpan;
}
export interface RenameInfoFailure {
    canRename: false;
    localizedErrorMessage: string;
}
export interface RenameInfoOptions {
    readonly allowRenameOfImportPath?: boolean;
}
export interface SignatureHelpParameter {
    name: string;
    documentation: SymbolDisplayPart[];
    displayParts: SymbolDisplayPart[];
    isOptional: boolean;
}
export interface SelectionRange {
    textSpan: ts.TextSpan;
    parent?: SelectionRange;
}
/**
 * Represents a single signature to show in signature help.
 * The id is used for subsequent calls into the language service to ask questions about the
 * signature help item in the context of any documents that have been updated.  i.e. after
 * an edit has happened, while signature help is still active, the host can ask important
 * questions like 'what parameter is the user currently contained within?'.
 */
export interface SignatureHelpItem {
    isVariadic: boolean;
    prefixDisplayParts: SymbolDisplayPart[];
    suffixDisplayParts: SymbolDisplayPart[];
    separatorDisplayParts: SymbolDisplayPart[];
    parameters: SignatureHelpParameter[];
    documentation: SymbolDisplayPart[];
    tags: JSDocTagInfo[];
}
/**
 * Represents a set of signature help items, and the preferred item that should be selected.
 */
export interface SignatureHelpItems {
    items: SignatureHelpItem[];
    applicableSpan: ts.TextSpan;
    selectedItemIndex: number;
    argumentIndex: number;
    argumentCount: number;
}
export interface CompletionInfo {
    /** Not true for all global completions. This will be true if the enclosing scope matches a few syntax kinds. See `isSnippetScope`. */
    isGlobalCompletion: boolean;
    isMemberCompletion: boolean;
    /**
     * true when the current location also allows for a new identifier
     */
    isNewIdentifierLocation: boolean;
    entries: CompletionEntry[];
}
// see comments in protocol.ts
export interface CompletionEntry {
    name: string;
    kind: ScriptElementKind;
    kindModifiers?: string; // see ScriptElementKindModifier, comma separated
    sortText: string;
    insertText?: string;
    /**
     * An optional span that indicates the text to be replaced by this completion item.
     * If present, this span should be used instead of the default one.
     * It will be set if the required span differs from the one generated by the default replacement behavior.
     */
    replacementSpan?: ts.TextSpan;
    hasAction?: true;
    source?: string;
    isRecommended?: true;
}
export interface CompletionEntryDetails {
    name: string;
    kind: ScriptElementKind;
    kindModifiers: string; // see ScriptElementKindModifier, comma separated
    displayParts: SymbolDisplayPart[];
    documentation?: SymbolDisplayPart[];
    tags?: JSDocTagInfo[];
    codeActions?: CodeAction[];
    source?: SymbolDisplayPart[];
}
export interface OutliningSpan {
    /** The span of the document to actually collapse. */
    textSpan: ts.TextSpan;
    /** The span of the document to display when the user hovers over the collapsed span. */
    hintSpan: ts.TextSpan;
    /** The text to display in the editor for the collapsed region. */
    bannerText: string;
    /**
     * Whether or not this region should be automatically collapsed when
     * the 'Collapse to Definitions' command is invoked.
     */
    autoCollapse: boolean;
    /**
     * Classification of the contents of the span
     */
    kind: OutliningSpanKind;
}
export const enum OutliningSpanKind {
    /** Single or multi-line comments */
    Comment = "comment",
    /** Sections marked by '// #region' and '// #endregion' comments */
    Region = "region",
    /** Declarations and expressions */
    Code = "code",
    /** Contiguous blocks of import declarations */
    Imports = "imports"
}
export const enum OutputFileType {
    JavaScript,
    SourceMap,
    Declaration
}
export const enum EndOfLineState {
    None,
    InMultiLineCommentTrivia,
    InSingleQuoteStringLiteral,
    InDoubleQuoteStringLiteral,
    InTemplateHeadOrNoSubstitutionTemplate,
    InTemplateMiddleOrTail,
    InTemplateSubstitutionPosition
}
export enum TokenClass {
    Punctuation,
    Keyword,
    Operator,
    Comment,
    Whitespace,
    Identifier,
    NumberLiteral,
    BigIntLiteral,
    StringLiteral,
    RegExpLiteral
}
export interface ClassificationResult {
    finalLexState: EndOfLineState;
    entries: ClassificationInfo[];
}
export interface ClassificationInfo {
    length: number;
    classification: TokenClass;
}
export interface Classifier {
    /**
     * Gives lexical classifications of tokens on a line without any syntactic context.
     * For instance, a token consisting of the text 'string' can be either an identifier
     * named 'string' or the keyword 'string', however, because this classifier is not aware,
     * it relies on certain heuristics to give acceptable results. For classifications where
     * speed trumps accuracy, this function is preferable; however, for true accuracy, the
     * syntactic classifier is ideal. In fact, in certain editing scenarios, combining the
     * lexical, syntactic, and semantic classifiers may issue the best user experience.
     *
     * @param text                      The text of a line to classify.
     * @param lexState                  The state of the lexical classifier at the end of the previous line.
     * @param syntacticClassifierAbsent Whether the client is *not* using a syntactic classifier.
     *                                  If there is no syntactic classifier (syntacticClassifierAbsent=true),
     *                                  certain heuristics may be used in its place; however, if there is a
     *                                  syntactic classifier (syntacticClassifierAbsent=false), certain
     *                                  classifications which may be incorrectly categorized will be given
     *                                  back as Identifiers in order to allow the syntactic classifier to
     *                                  subsume the classification.
     * @deprecated Use getLexicalClassifications instead.
     */
    getClassificationsForLine(text: string, lexState: EndOfLineState, syntacticClassifierAbsent: boolean): ClassificationResult;
    getEncodedLexicalClassifications(text: string, endOfLineState: EndOfLineState, syntacticClassifierAbsent: boolean): Classifications;
}
export const enum ScriptElementKind {
    unknown = "",
    warning = "warning",
    /** predefined type (void) or keyword (class) */
    keyword = "keyword",
    /** top level script node */
    scriptElement = "script",
    /** module foo {} */
    moduleElement = "module",
    /** class X {} */
    classElement = "class",
    /** var x = class X {} */
    localClassElement = "local class",
    /** interface Y {} */
    interfaceElement = "interface",
    /** type T = ... */
    typeElement = "type",
    /** enum E */
    enumElement = "enum",
    enumMemberElement = "enum member",
    /**
     * Inside module and script only
     * const v = ..
     */
    variableElement = "var",
    /** Inside function */
    localVariableElement = "local var",
    /**
     * Inside module and script only
     * function f() { }
     */
    functionElement = "function",
    /** Inside function */
    localFunctionElement = "local function",
    /** class X { [public|private]* foo() {} } */
    memberFunctionElement = "method",
    /** class X { [public|private]* [get|set] foo:number; } */
    memberGetAccessorElement = "getter",
    memberSetAccessorElement = "setter",
    /**
     * class X { [public|private]* foo:number; }
     * interface Y { foo:number; }
     */
    memberVariableElement = "property",
    /** class X { constructor() { } } */
    constructorImplementationElement = "constructor",
    /** interface Y { ():number; } */
    callSignatureElement = "call",
    /** interface Y { []:number; } */
    indexSignatureElement = "index",
    /** interface Y { new():Y; } */
    constructSignatureElement = "construct",
    /** function foo(*Y*: string) */
    parameterElement = "parameter",
    typeParameterElement = "type parameter",
    primitiveType = "primitive type",
    label = "label",
    alias = "alias",
    constElement = "const",
    letElement = "let",
    directory = "directory",
    externalModuleName = "external module name",
    /**
     * <JsxTagName attribute1 attribute2={0} />
     */
    jsxAttribute = "JSX attribute",
    /** String literal */
    string = "string"
}
export const enum ScriptElementKindModifier {
    none = "",
    publicMemberModifier = "public",
    privateMemberModifier = "private",
    protectedMemberModifier = "protected",
    exportedModifier = "export",
    ambientModifier = "declare",
    staticModifier = "static",
    abstractModifier = "abstract",
    optionalModifier = "optional",
    dtsModifier = ".d.ts",
    tsModifier = ".ts",
    tsxModifier = ".tsx",
    jsModifier = ".js",
    jsxModifier = ".jsx",
    jsonModifier = ".json"
}
export const enum ClassificationTypeNames {
    comment = "comment",
    identifier = "identifier",
    keyword = "keyword",
    numericLiteral = "number",
    bigintLiteral = "bigint",
    operator = "operator",
    stringLiteral = "string",
    whiteSpace = "whitespace",
    text = "text",
    punctuation = "punctuation",
    className = "class name",
    enumName = "enum name",
    interfaceName = "interface name",
    moduleName = "module name",
    typeParameterName = "type parameter name",
    typeAliasName = "type alias name",
    parameterName = "parameter name",
    docCommentTagName = "doc comment tag name",
    jsxOpenTagName = "jsx open tag name",
    jsxCloseTagName = "jsx close tag name",
    jsxSelfClosingTagName = "jsx self closing tag name",
    jsxAttribute = "jsx attribute",
    jsxText = "jsx text",
    jsxAttributeStringLiteralValue = "jsx attribute string literal value"
}
export const enum ClassificationType {
    comment = 1,
    identifier = 2,
    keyword = 3,
    numericLiteral = 4,
    operator = 5,
    stringLiteral = 6,
    regularExpressionLiteral = 7,
    whiteSpace = 8,
    text = 9,
    punctuation = 10,
    className = 11,
    enumName = 12,
    interfaceName = 13,
    moduleName = 14,
    typeParameterName = 15,
    typeAliasName = 16,
    parameterName = 17,
    docCommentTagName = 18,
    jsxOpenTagName = 19,
    jsxCloseTagName = 20,
    jsxSelfClosingTagName = 21,
    jsxAttribute = 22,
    jsxText = 23,
    jsxAttributeStringLiteralValue = 24,
    bigintLiteral = 25
}
/** @internal */
export interface CodeFixRegistration {
    errorCodes: readonly number[];
    getCodeActions(context: CodeFixContext): CodeFixAction[] | undefined;
    fixIds?: readonly string[];
    getAllCodeActions?(context: CodeFixAllContext): CombinedCodeActions;
}
/** @internal */
export interface CodeFixContextBase extends ts.textChanges.TextChangesContext {
    sourceFile: ts.SourceFile;
    program: ts.Program;
    cancellationToken: ts.CancellationToken;
    preferences: ts.UserPreferences;
}
/** @internal */
export interface CodeFixAllContext extends CodeFixContextBase {
    fixId: {};
}
/** @internal */
export interface CodeFixContext extends CodeFixContextBase {
    errorCode: number;
    span: ts.TextSpan;
}
/** @internal */
export interface Refactor {
    /** Compute the associated code actions */
    getEditsForAction(context: RefactorContext, actionName: string): RefactorEditInfo | undefined;
    /** Compute (quickly) which actions are available here */
    getAvailableActions(context: RefactorContext): readonly ApplicableRefactorInfo[];
}
/** @internal */
export interface RefactorContext extends ts.textChanges.TextChangesContext {
    file: ts.SourceFile;
    startPosition: number;
    endPosition?: number;
    program: ts.Program;
    cancellationToken?: ts.CancellationToken;
    preferences: ts.UserPreferences;
}
