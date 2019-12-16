/* @internal */
namespace ts {
    export const resolvingEmptyArray: never[] = [] as never[];
    export const emptyMap = (ts.createMap<never>() as ts.ReadonlyMap<never> & ts.ReadonlyPragmaMap);
    export const emptyUnderscoreEscapedMap: ts.ReadonlyUnderscoreEscapedMap<never> = (emptyMap as ts.ReadonlyUnderscoreEscapedMap<never>);
    export const externalHelpersModuleNameText = "tslib";
    export const defaultMaximumTruncationLength = 160;
    export function getDeclarationOfKind<T extends ts.Declaration>(symbol: ts.Symbol, kind: T["kind"]): T | undefined {
        const declarations = symbol.declarations;
        if (declarations) {
            for (const declaration of declarations) {
                if (declaration.kind === kind) {
                    return declaration as T;
                }
            }
        }
        return undefined;
    }
    /** Create a new escaped identifier map. */
    export function createUnderscoreEscapedMap<T>(): ts.UnderscoreEscapedMap<T> {
        return new ts.Map<T>() as ts.UnderscoreEscapedMap<T>;
    }
    export function hasEntries(map: ts.ReadonlyUnderscoreEscapedMap<any> | undefined): map is ts.ReadonlyUnderscoreEscapedMap<any> {
        return !!map && !!map.size;
    }
    export function createSymbolTable(symbols?: readonly ts.Symbol[]): ts.SymbolTable {
        const result = (ts.createMap<ts.Symbol>() as ts.SymbolTable);
        if (symbols) {
            for (const symbol of symbols) {
                result.set(symbol.escapedName, symbol);
            }
        }
        return result;
    }
    const stringWriter = createSingleLineStringWriter();
    function createSingleLineStringWriter(): ts.EmitTextWriter {
        let str = "";
        const writeText: (text: string) => void = text => str += text;
        return {
            getText: () => str,
            write: writeText,
            rawWrite: writeText,
            writeKeyword: writeText,
            writeOperator: writeText,
            writePunctuation: writeText,
            writeSpace: writeText,
            writeStringLiteral: writeText,
            writeLiteral: writeText,
            writeParameter: writeText,
            writeProperty: writeText,
            writeSymbol: (s, _) => writeText(s),
            writeTrailingSemicolon: writeText,
            writeComment: writeText,
            getTextPos: () => str.length,
            getLine: () => 0,
            getColumn: () => 0,
            getIndent: () => 0,
            isAtStartOfLine: () => false,
            hasTrailingComment: () => false,
            hasTrailingWhitespace: () => !!str.length && ts.isWhiteSpaceLike(str.charCodeAt(str.length - 1)),
            // Completely ignore indentation for string writers.  And map newlines to
            // a single space.
            writeLine: () => str += " ",
            increaseIndent: ts.noop,
            decreaseIndent: ts.noop,
            clear: () => str = "",
            trackSymbol: ts.noop,
            reportInaccessibleThisError: ts.noop,
            reportInaccessibleUniqueSymbolError: ts.noop,
            reportPrivateInBaseOfClassExpression: ts.noop,
        };
    }
    export function changesAffectModuleResolution(oldOptions: ts.CompilerOptions, newOptions: ts.CompilerOptions): boolean {
        return oldOptions.configFilePath !== newOptions.configFilePath ||
            optionsHaveModuleResolutionChanges(oldOptions, newOptions);
    }
    export function optionsHaveModuleResolutionChanges(oldOptions: ts.CompilerOptions, newOptions: ts.CompilerOptions) {
        return ts.moduleResolutionOptionDeclarations.some(o => !isJsonEqual(getCompilerOptionValue(oldOptions, o), getCompilerOptionValue(newOptions, o)));
    }
    /**
     * Iterates through the parent chain of a node and performs the callback on each parent until the callback
     * returns a truthy value, then returns that value.
     * If no such value is found, it applies the callback until the parent pointer is undefined or the callback returns "quit"
     * At that point findAncestor returns undefined.
     */
    export function findAncestor<T extends ts.Node>(node: ts.Node | undefined, callback: (element: ts.Node) => element is T): T | undefined;
    export function findAncestor(node: ts.Node | undefined, callback: (element: ts.Node) => boolean | "quit"): ts.Node | undefined;
    export function findAncestor(node: ts.Node, callback: (element: ts.Node) => boolean | "quit"): ts.Node | undefined {
        while (node) {
            const result = callback(node);
            if (result === "quit") {
                return undefined;
            }
            else if (result) {
                return node;
            }
            node = node.parent;
        }
        return undefined;
    }
    export function forEachAncestor<T>(node: ts.Node, callback: (n: ts.Node) => T | undefined | "quit"): T | undefined {
        while (true) {
            const res = callback(node);
            if (res === "quit")
                return undefined;
            if (res !== undefined)
                return res;
            if (ts.isSourceFile(node))
                return undefined;
            node = node.parent;
        }
    }
    /**
     * Calls `callback` for each entry in the map, returning the first truthy result.
     * Use `map.forEach` instead for normal iteration.
     */
    export function forEachEntry<T, U>(map: ts.ReadonlyUnderscoreEscapedMap<T>, callback: (value: T, key: ts.__String) => U | undefined): U | undefined;
    export function forEachEntry<T, U>(map: ts.ReadonlyMap<T>, callback: (value: T, key: string) => U | undefined): U | undefined;
    export function forEachEntry<T, U>(map: ts.ReadonlyUnderscoreEscapedMap<T> | ts.ReadonlyMap<T>, callback: (value: T, key: (string & ts.__String)) => U | undefined): U | undefined {
        const iterator = map.entries();
        for (let iterResult = iterator.next(); !iterResult.done; iterResult = iterator.next()) {
            const [key, value] = iterResult.value;
            const result = callback(value, (key as (string & ts.__String)));
            if (result) {
                return result;
            }
        }
        return undefined;
    }
    /** `forEachEntry` for just keys. */
    export function forEachKey<T>(map: ts.ReadonlyUnderscoreEscapedMap<{}>, callback: (key: ts.__String) => T | undefined): T | undefined;
    export function forEachKey<T>(map: ts.ReadonlyMap<{}>, callback: (key: string) => T | undefined): T | undefined;
    export function forEachKey<T>(map: ts.ReadonlyUnderscoreEscapedMap<{}> | ts.ReadonlyMap<{}>, callback: (key: string & ts.__String) => T | undefined): T | undefined {
        const iterator = map.keys();
        for (let iterResult = iterator.next(); !iterResult.done; iterResult = iterator.next()) {
            const result = callback((iterResult.value as string & ts.__String));
            if (result) {
                return result;
            }
        }
        return undefined;
    }
    /** Copy entries from `source` to `target`. */
    export function copyEntries<T>(source: ts.ReadonlyUnderscoreEscapedMap<T>, target: ts.UnderscoreEscapedMap<T>): void;
    export function copyEntries<T>(source: ts.ReadonlyMap<T>, target: ts.Map<T>): void;
    export function copyEntries<T, U extends ts.UnderscoreEscapedMap<T> | ts.Map<T>>(source: U, target: U): void {
        (source as ts.Map<T>).forEach((value, key) => {
            (target as ts.Map<T>).set(key, value);
        });
    }
    /**
     * Creates a set from the elements of an array.
     *
     * @param array the array of input elements.
     */
    export function arrayToSet(array: readonly string[]): ts.Map<true>;
    export function arrayToSet<T>(array: readonly T[], makeKey: (value: T) => string | undefined): ts.Map<true>;
    export function arrayToSet<T>(array: readonly T[], makeKey: (value: T) => ts.__String | undefined): ts.UnderscoreEscapedMap<true>;
    export function arrayToSet(array: readonly any[], makeKey?: (value: any) => string | ts.__String | undefined): ts.Map<true> | ts.UnderscoreEscapedMap<true> {
        return ts.arrayToMap<any, true>(array, makeKey || (s => s), ts.returnTrue);
    }
    export function cloneMap(map: ts.SymbolTable): ts.SymbolTable;
    export function cloneMap<T>(map: ts.ReadonlyMap<T>): ts.Map<T>;
    export function cloneMap<T>(map: ts.ReadonlyUnderscoreEscapedMap<T>): ts.UnderscoreEscapedMap<T>;
    export function cloneMap<T>(map: ts.ReadonlyMap<T> | ts.ReadonlyUnderscoreEscapedMap<T> | ts.SymbolTable): ts.Map<T> | ts.UnderscoreEscapedMap<T> | ts.SymbolTable {
        const clone = ts.createMap<T>();
        copyEntries((map as ts.Map<T>), clone);
        return clone;
    }
    export function usingSingleLineStringWriter(action: (writer: ts.EmitTextWriter) => void): string {
        const oldString = stringWriter.getText();
        try {
            action(stringWriter);
            return stringWriter.getText();
        }
        finally {
            stringWriter.clear();
            stringWriter.writeKeyword(oldString);
        }
    }
    export function getFullWidth(node: ts.Node) {
        return node.end - node.pos;
    }
    export function getResolvedModule(sourceFile: ts.SourceFile | undefined, moduleNameText: string): ts.ResolvedModuleFull | undefined {
        return sourceFile && sourceFile.resolvedModules && sourceFile.resolvedModules.get(moduleNameText);
    }
    export function setResolvedModule(sourceFile: ts.SourceFile, moduleNameText: string, resolvedModule: ts.ResolvedModuleFull): void {
        if (!sourceFile.resolvedModules) {
            sourceFile.resolvedModules = ts.createMap<ts.ResolvedModuleFull>();
        }
        sourceFile.resolvedModules.set(moduleNameText, resolvedModule);
    }
    export function setResolvedTypeReferenceDirective(sourceFile: ts.SourceFile, typeReferenceDirectiveName: string, resolvedTypeReferenceDirective?: ts.ResolvedTypeReferenceDirective): void {
        if (!sourceFile.resolvedTypeReferenceDirectiveNames) {
            sourceFile.resolvedTypeReferenceDirectiveNames = ts.createMap<ts.ResolvedTypeReferenceDirective | undefined>();
        }
        sourceFile.resolvedTypeReferenceDirectiveNames.set(typeReferenceDirectiveName, resolvedTypeReferenceDirective);
    }
    export function projectReferenceIsEqualTo(oldRef: ts.ProjectReference, newRef: ts.ProjectReference) {
        return oldRef.path === newRef.path &&
            !oldRef.prepend === !newRef.prepend &&
            !oldRef.circular === !newRef.circular;
    }
    export function moduleResolutionIsEqualTo(oldResolution: ts.ResolvedModuleFull, newResolution: ts.ResolvedModuleFull): boolean {
        return oldResolution.isExternalLibraryImport === newResolution.isExternalLibraryImport &&
            oldResolution.extension === newResolution.extension &&
            oldResolution.resolvedFileName === newResolution.resolvedFileName &&
            oldResolution.originalPath === newResolution.originalPath &&
            packageIdIsEqual(oldResolution.packageId, newResolution.packageId);
    }
    function packageIdIsEqual(a: ts.PackageId | undefined, b: ts.PackageId | undefined): boolean {
        return a === b || !!a && !!b && a.name === b.name && a.subModuleName === b.subModuleName && a.version === b.version;
    }
    export function packageIdToString({ name, subModuleName, version }: ts.PackageId): string {
        const fullName = subModuleName ? `${name}/${subModuleName}` : name;
        return `${fullName}@${version}`;
    }
    export function typeDirectiveIsEqualTo(oldResolution: ts.ResolvedTypeReferenceDirective, newResolution: ts.ResolvedTypeReferenceDirective): boolean {
        return oldResolution.resolvedFileName === newResolution.resolvedFileName && oldResolution.primary === newResolution.primary;
    }
    export function hasChangesInResolutions<T>(names: readonly string[], newResolutions: readonly T[], oldResolutions: ts.ReadonlyMap<T> | undefined, comparer: (oldResolution: T, newResolution: T) => boolean): boolean {
        ts.Debug.assert(names.length === newResolutions.length);
        for (let i = 0; i < names.length; i++) {
            const newResolution = newResolutions[i];
            const oldResolution = oldResolutions && oldResolutions.get(names[i]);
            const changed = oldResolution
                ? !newResolution || !comparer(oldResolution, newResolution)
                : newResolution;
            if (changed) {
                return true;
            }
        }
        return false;
    }
    // Returns true if this node contains a parse error anywhere underneath it.
    export function containsParseError(node: ts.Node): boolean {
        aggregateChildData(node);
        return (node.flags & ts.NodeFlags.ThisNodeOrAnySubNodesHasError) !== 0;
    }
    function aggregateChildData(node: ts.Node): void {
        if (!(node.flags & ts.NodeFlags.HasAggregatedChildData)) {
            // A node is considered to contain a parse error if:
            //  a) the parser explicitly marked that it had an error
            //  b) any of it's children reported that it had an error.
            const thisNodeOrAnySubNodesHasError = ((node.flags & ts.NodeFlags.ThisNodeHasError) !== 0) ||
                ts.forEachChild(node, containsParseError);
            // If so, mark ourselves accordingly.
            if (thisNodeOrAnySubNodesHasError) {
                node.flags |= ts.NodeFlags.ThisNodeOrAnySubNodesHasError;
            }
            // Also mark that we've propagated the child information to this node.  This way we can
            // always consult the bit directly on this node without needing to check its children
            // again.
            node.flags |= ts.NodeFlags.HasAggregatedChildData;
        }
    }
    export function getSourceFileOfNode(node: ts.Node): ts.SourceFile;
    export function getSourceFileOfNode(node: ts.Node | undefined): ts.SourceFile | undefined;
    export function getSourceFileOfNode(node: ts.Node): ts.SourceFile {
        while (node && node.kind !== ts.SyntaxKind.SourceFile) {
            node = node.parent;
        }
        return <ts.SourceFile>node;
    }
    export function isStatementWithLocals(node: ts.Node) {
        switch (node.kind) {
            case ts.SyntaxKind.Block:
            case ts.SyntaxKind.CaseBlock:
            case ts.SyntaxKind.ForStatement:
            case ts.SyntaxKind.ForInStatement:
            case ts.SyntaxKind.ForOfStatement:
                return true;
        }
        return false;
    }
    export function getStartPositionOfLine(line: number, sourceFile: ts.SourceFileLike): number {
        ts.Debug.assert(line >= 0);
        return ts.getLineStarts(sourceFile)[line];
    }
    // This is a useful function for debugging purposes.
    export function nodePosToString(node: ts.Node): string {
        const file = getSourceFileOfNode(node);
        const loc = ts.getLineAndCharacterOfPosition(file, node.pos);
        return `${file.fileName}(${loc.line + 1},${loc.character + 1})`;
    }
    export function getEndLinePosition(line: number, sourceFile: ts.SourceFileLike): number {
        ts.Debug.assert(line >= 0);
        const lineStarts = ts.getLineStarts(sourceFile);
        const lineIndex = line;
        const sourceText = sourceFile.text;
        if (lineIndex + 1 === lineStarts.length) {
            // last line - return EOF
            return sourceText.length - 1;
        }
        else {
            // current line start
            const start = lineStarts[lineIndex];
            // take the start position of the next line - 1 = it should be some line break
            let pos = lineStarts[lineIndex + 1] - 1;
            ts.Debug.assert(ts.isLineBreak(sourceText.charCodeAt(pos)));
            // walk backwards skipping line breaks, stop the the beginning of current line.
            // i.e:
            // <some text>
            // $ <- end of line for this position should match the start position
            while (start <= pos && ts.isLineBreak(sourceText.charCodeAt(pos))) {
                pos--;
            }
            return pos;
        }
    }
    /**
     * Returns a value indicating whether a name is unique globally or within the current file.
     * Note: This does not consider whether a name appears as a free identifier or not, so at the expression `x.y` this includes both `x` and `y`.
     */
    export function isFileLevelUniqueName(sourceFile: ts.SourceFile, name: string, hasGlobalName?: ts.PrintHandlers["hasGlobalName"]): boolean {
        return !(hasGlobalName && hasGlobalName(name)) && !sourceFile.identifiers.has(name);
    }
    // Returns true if this node is missing from the actual source code. A 'missing' node is different
    // from 'undefined/defined'. When a node is undefined (which can happen for optional nodes
    // in the tree), it is definitely missing. However, a node may be defined, but still be
    // missing.  This happens whenever the parser knows it needs to parse something, but can't
    // get anything in the source code that it expects at that location. For example:
    //
    //          let a: ;
    //
    // Here, the Type in the Type-Annotation is not-optional (as there is a colon in the source
    // code). So the parser will attempt to parse out a type, and will create an actual node.
    // However, this node will be 'missing' in the sense that no actual source-code/tokens are
    // contained within it.
    export function nodeIsMissing(node: ts.Node | undefined): boolean {
        if (node === undefined) {
            return true;
        }
        return node.pos === node.end && node.pos >= 0 && node.kind !== ts.SyntaxKind.EndOfFileToken;
    }
    export function nodeIsPresent(node: ts.Node | undefined): boolean {
        return !nodeIsMissing(node);
    }
    function insertStatementsAfterPrologue<T extends ts.Statement>(to: T[], from: readonly T[] | undefined, isPrologueDirective: (node: ts.Node) => boolean): T[] {
        if (from === undefined || from.length === 0)
            return to;
        let statementIndex = 0;
        // skip all prologue directives to insert at the correct position
        for (; statementIndex < to.length; ++statementIndex) {
            if (!isPrologueDirective(to[statementIndex])) {
                break;
            }
        }
        to.splice(statementIndex, 0, ...from);
        return to;
    }
    function insertStatementAfterPrologue<T extends ts.Statement>(to: T[], statement: T | undefined, isPrologueDirective: (node: ts.Node) => boolean): T[] {
        if (statement === undefined)
            return to;
        let statementIndex = 0;
        // skip all prologue directives to insert at the correct position
        for (; statementIndex < to.length; ++statementIndex) {
            if (!isPrologueDirective(to[statementIndex])) {
                break;
            }
        }
        to.splice(statementIndex, 0, statement);
        return to;
    }
    function isAnyPrologueDirective(node: ts.Node) {
        return isPrologueDirective(node) || !!(getEmitFlags(node) & ts.EmitFlags.CustomPrologue);
    }
    /**
     * Prepends statements to an array while taking care of prologue directives.
     */
    export function insertStatementsAfterStandardPrologue<T extends ts.Statement>(to: T[], from: readonly T[] | undefined): T[] {
        return insertStatementsAfterPrologue(to, from, isPrologueDirective);
    }
    export function insertStatementsAfterCustomPrologue<T extends ts.Statement>(to: T[], from: readonly T[] | undefined): T[] {
        return insertStatementsAfterPrologue(to, from, isAnyPrologueDirective);
    }
    /**
     * Prepends statements to an array while taking care of prologue directives.
     */
    export function insertStatementAfterStandardPrologue<T extends ts.Statement>(to: T[], statement: T | undefined): T[] {
        return insertStatementAfterPrologue(to, statement, isPrologueDirective);
    }
    export function insertStatementAfterCustomPrologue<T extends ts.Statement>(to: T[], statement: T | undefined): T[] {
        return insertStatementAfterPrologue(to, statement, isAnyPrologueDirective);
    }
    /**
     * Determine if the given comment is a triple-slash
     *
     * @return true if the comment is a triple-slash comment else false
     */
    export function isRecognizedTripleSlashComment(text: string, commentPos: number, commentEnd: number) {
        // Verify this is /// comment, but do the regexp match only when we first can find /// in the comment text
        // so that we don't end up computing comment string and doing match for all // comments
        if (text.charCodeAt(commentPos + 1) === ts.CharacterCodes.slash &&
            commentPos + 2 < commentEnd &&
            text.charCodeAt(commentPos + 2) === ts.CharacterCodes.slash) {
            const textSubStr = text.substring(commentPos, commentEnd);
            return textSubStr.match(fullTripleSlashReferencePathRegEx) ||
                textSubStr.match(fullTripleSlashAMDReferencePathRegEx) ||
                textSubStr.match(fullTripleSlashReferenceTypeReferenceDirectiveRegEx) ||
                textSubStr.match(defaultLibReferenceRegEx) ?
                true : false;
        }
        return false;
    }
    export function isPinnedComment(text: string, start: number) {
        return text.charCodeAt(start + 1) === ts.CharacterCodes.asterisk &&
            text.charCodeAt(start + 2) === ts.CharacterCodes.exclamation;
    }
    export function getTokenPosOfNode(node: ts.Node, sourceFile?: ts.SourceFileLike, includeJsDoc?: boolean): number {
        // With nodes that have no width (i.e. 'Missing' nodes), we actually *don't*
        // want to skip trivia because this will launch us forward to the next token.
        if (nodeIsMissing(node)) {
            return node.pos;
        }
        if (ts.isJSDocNode(node)) {
            return ts.skipTrivia((sourceFile || getSourceFileOfNode(node)).text, node.pos, /*stopAfterLineBreak*/ false, /*stopAtComments*/ true);
        }
        if (includeJsDoc && ts.hasJSDocNodes(node)) {
            return getTokenPosOfNode(node.jsDoc![0]);
        }
        // For a syntax list, it is possible that one of its children has JSDocComment nodes, while
        // the syntax list itself considers them as normal trivia. Therefore if we simply skip
        // trivia for the list, we may have skipped the JSDocComment as well. So we should process its
        // first child to determine the actual position of its first token.
        if (node.kind === ts.SyntaxKind.SyntaxList && (<ts.SyntaxList>node)._children.length > 0) {
            return getTokenPosOfNode((<ts.SyntaxList>node)._children[0], sourceFile, includeJsDoc);
        }
        return ts.skipTrivia((sourceFile || getSourceFileOfNode(node)).text, node.pos);
    }
    export function getNonDecoratorTokenPosOfNode(node: ts.Node, sourceFile?: ts.SourceFileLike): number {
        if (nodeIsMissing(node) || !node.decorators) {
            return getTokenPosOfNode(node, sourceFile);
        }
        return ts.skipTrivia((sourceFile || getSourceFileOfNode(node)).text, node.decorators.end);
    }
    export function getSourceTextOfNodeFromSourceFile(sourceFile: ts.SourceFile, node: ts.Node, includeTrivia = false): string {
        return getTextOfNodeFromSourceText(sourceFile.text, node, includeTrivia);
    }
    function isJSDocTypeExpressionOrChild(node: ts.Node): boolean {
        return node.kind === ts.SyntaxKind.JSDocTypeExpression || (node.parent && isJSDocTypeExpressionOrChild(node.parent));
    }
    export function getTextOfNodeFromSourceText(sourceText: string, node: ts.Node, includeTrivia = false): string {
        if (nodeIsMissing(node)) {
            return "";
        }
        let text = sourceText.substring(includeTrivia ? node.pos : ts.skipTrivia(sourceText, node.pos), node.end);
        if (isJSDocTypeExpressionOrChild(node)) {
            // strip space + asterisk at line start
            text = text.replace(/(^|\r?\n|\r)\s*\*\s*/g, "$1");
        }
        return text;
    }
    export function getTextOfNode(node: ts.Node, includeTrivia = false): string {
        return getSourceTextOfNodeFromSourceFile(getSourceFileOfNode(node), node, includeTrivia);
    }
    function getPos(range: ts.Node) {
        return range.pos;
    }
    /**
     * Note: it is expected that the `nodeArray` and the `node` are within the same file.
     * For example, searching for a `SourceFile` in a `SourceFile[]` wouldn't work.
     */
    export function indexOfNode(nodeArray: readonly ts.Node[], node: ts.Node) {
        return ts.binarySearch(nodeArray, node, getPos, ts.compareValues);
    }
    /**
     * Gets flags that control emit behavior of a node.
     */
    export function getEmitFlags(node: ts.Node): ts.EmitFlags {
        const emitNode = node.emitNode;
        return emitNode && emitNode.flags || 0;
    }
    export function getLiteralText(node: ts.LiteralLikeNode, sourceFile: ts.SourceFile, neverAsciiEscape: boolean | undefined) {
        // If we don't need to downlevel and we can reach the original source text using
        // the node's parent reference, then simply get the text as it was originally written.
        if (!nodeIsSynthesized(node) && node.parent && !((ts.isNumericLiteral(node) && node.numericLiteralFlags & ts.TokenFlags.ContainsSeparator) ||
            ts.isBigIntLiteral(node))) {
            return getSourceTextOfNodeFromSourceFile(sourceFile, node);
        }
        // If a NoSubstitutionTemplateLiteral appears to have a substitution in it, the original text
        // had to include a backslash: `not \${a} substitution`.
        const escapeText = neverAsciiEscape || (getEmitFlags(node) & ts.EmitFlags.NoAsciiEscaping) ? escapeString : escapeNonAsciiString;
        // If we can't reach the original source text, use the canonical form if it's a number,
        // or a (possibly escaped) quoted form of the original text if it's string-like.
        switch (node.kind) {
            case ts.SyntaxKind.StringLiteral:
                if ((<ts.StringLiteral>node).singleQuote) {
                    return "'" + escapeText(node.text, ts.CharacterCodes.singleQuote) + "'";
                }
                else {
                    return '"' + escapeText(node.text, ts.CharacterCodes.doubleQuote) + '"';
                }
            case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
            case ts.SyntaxKind.TemplateHead:
            case ts.SyntaxKind.TemplateMiddle:
            case ts.SyntaxKind.TemplateTail:
                const rawText = (<ts.TemplateLiteralLikeNode>node).rawText || escapeTemplateSubstitution(escapeText(node.text, ts.CharacterCodes.backtick));
                switch (node.kind) {
                    case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
                        return "`" + rawText + "`";
                    case ts.SyntaxKind.TemplateHead:
                        return "`" + rawText + "${";
                    case ts.SyntaxKind.TemplateMiddle:
                        return "}" + rawText + "${";
                    case ts.SyntaxKind.TemplateTail:
                        return "}" + rawText + "`";
                }
                break;
            case ts.SyntaxKind.NumericLiteral:
            case ts.SyntaxKind.BigIntLiteral:
            case ts.SyntaxKind.RegularExpressionLiteral:
                return node.text;
        }
        return ts.Debug.fail(`Literal kind '${node.kind}' not accounted for.`);
    }
    export function getTextOfConstantValue(value: string | number) {
        return ts.isString(value) ? '"' + escapeNonAsciiString(value) + '"' : "" + value;
    }
    // Make an identifier from an external module name by extracting the string after the last "/" and replacing
    // all non-alphanumeric characters with underscores
    export function makeIdentifierFromModuleName(moduleName: string): string {
        return ts.getBaseFileName(moduleName).replace(/^(\d)/, "_$1").replace(/\W/g, "_");
    }
    export function isBlockOrCatchScoped(declaration: ts.Declaration) {
        return (ts.getCombinedNodeFlags(declaration) & ts.NodeFlags.BlockScoped) !== 0 ||
            isCatchClauseVariableDeclarationOrBindingElement(declaration);
    }
    export function isCatchClauseVariableDeclarationOrBindingElement(declaration: ts.Declaration) {
        const node = getRootDeclaration(declaration);
        return node.kind === ts.SyntaxKind.VariableDeclaration && node.parent.kind === ts.SyntaxKind.CatchClause;
    }
    export function isAmbientModule(node: ts.Node): node is ts.AmbientModuleDeclaration {
        return ts.isModuleDeclaration(node) && (node.name.kind === ts.SyntaxKind.StringLiteral || isGlobalScopeAugmentation(node));
    }
    export function isModuleWithStringLiteralName(node: ts.Node): node is ts.ModuleDeclaration {
        return ts.isModuleDeclaration(node) && node.name.kind === ts.SyntaxKind.StringLiteral;
    }
    export function isNonGlobalAmbientModule(node: ts.Node): node is ts.ModuleDeclaration & {
        name: ts.StringLiteral;
    } {
        return ts.isModuleDeclaration(node) && ts.isStringLiteral(node.name);
    }
    /**
     * An effective module (namespace) declaration is either
     * 1. An actual declaration: namespace X { ... }
     * 2. A Javascript declaration, which is:
     *    An identifier in a nested property access expression: Y in `X.Y.Z = { ... }`
     */
    export function isEffectiveModuleDeclaration(node: ts.Node) {
        return ts.isModuleDeclaration(node) || ts.isIdentifier(node);
    }
    /** Given a symbol for a module, checks that it is a shorthand ambient module. */
    export function isShorthandAmbientModuleSymbol(moduleSymbol: ts.Symbol): boolean {
        return isShorthandAmbientModule(moduleSymbol.valueDeclaration);
    }
    function isShorthandAmbientModule(node: ts.Node): boolean {
        // The only kind of module that can be missing a body is a shorthand ambient module.
        return node && node.kind === ts.SyntaxKind.ModuleDeclaration && (!(<ts.ModuleDeclaration>node).body);
    }
    export function isBlockScopedContainerTopLevel(node: ts.Node): boolean {
        return node.kind === ts.SyntaxKind.SourceFile ||
            node.kind === ts.SyntaxKind.ModuleDeclaration ||
            ts.isFunctionLike(node);
    }
    export function isGlobalScopeAugmentation(module: ts.ModuleDeclaration): boolean {
        return !!(module.flags & ts.NodeFlags.GlobalAugmentation);
    }
    export function isExternalModuleAugmentation(node: ts.Node): node is ts.AmbientModuleDeclaration {
        return isAmbientModule(node) && isModuleAugmentationExternal(node);
    }
    export function isModuleAugmentationExternal(node: ts.AmbientModuleDeclaration) {
        // external module augmentation is a ambient module declaration that is either:
        // - defined in the top level scope and source file is an external module
        // - defined inside ambient module declaration located in the top level scope and source file not an external module
        switch (node.parent.kind) {
            case ts.SyntaxKind.SourceFile:
                return ts.isExternalModule(node.parent);
            case ts.SyntaxKind.ModuleBlock:
                return isAmbientModule(node.parent.parent) && ts.isSourceFile(node.parent.parent.parent) && !ts.isExternalModule(node.parent.parent.parent);
        }
        return false;
    }
    export function getNonAugmentationDeclaration(symbol: ts.Symbol) {
        return ts.find(symbol.declarations, d => !isExternalModuleAugmentation(d) && !(ts.isModuleDeclaration(d) && isGlobalScopeAugmentation(d)));
    }
    export function isEffectiveExternalModule(node: ts.SourceFile, compilerOptions: ts.CompilerOptions) {
        return ts.isExternalModule(node) || compilerOptions.isolatedModules || ((getEmitModuleKind(compilerOptions) === ts.ModuleKind.CommonJS) && !!node.commonJsModuleIndicator);
    }
    /**
     * Returns whether the source file will be treated as if it were in strict mode at runtime.
     */
    export function isEffectiveStrictModeSourceFile(node: ts.SourceFile, compilerOptions: ts.CompilerOptions) {
        // We can only verify strict mode for JS/TS files
        switch (node.scriptKind) {
            case ts.ScriptKind.JS:
            case ts.ScriptKind.TS:
            case ts.ScriptKind.JSX:
            case ts.ScriptKind.TSX:
                break;
            default:
                return false;
        }
        // Strict mode does not matter for declaration files.
        if (node.isDeclarationFile) {
            return false;
        }
        // If `alwaysStrict` is set, then treat the file as strict.
        if (getStrictOptionValue(compilerOptions, "alwaysStrict")) {
            return true;
        }
        // Starting with a "use strict" directive indicates the file is strict.
        if (ts.startsWithUseStrict(node.statements)) {
            return true;
        }
        if (ts.isExternalModule(node) || compilerOptions.isolatedModules) {
            // ECMAScript Modules are always strict.
            if (getEmitModuleKind(compilerOptions) >= ts.ModuleKind.ES2015) {
                return true;
            }
            // Other modules are strict unless otherwise specified.
            return !compilerOptions.noImplicitUseStrict;
        }
        return false;
    }
    export function isBlockScope(node: ts.Node, parentNode: ts.Node): boolean {
        switch (node.kind) {
            case ts.SyntaxKind.SourceFile:
            case ts.SyntaxKind.CaseBlock:
            case ts.SyntaxKind.CatchClause:
            case ts.SyntaxKind.ModuleDeclaration:
            case ts.SyntaxKind.ForStatement:
            case ts.SyntaxKind.ForInStatement:
            case ts.SyntaxKind.ForOfStatement:
            case ts.SyntaxKind.Constructor:
            case ts.SyntaxKind.MethodDeclaration:
            case ts.SyntaxKind.GetAccessor:
            case ts.SyntaxKind.SetAccessor:
            case ts.SyntaxKind.FunctionDeclaration:
            case ts.SyntaxKind.FunctionExpression:
            case ts.SyntaxKind.ArrowFunction:
                return true;
            case ts.SyntaxKind.Block:
                // function block is not considered block-scope container
                // see comment in binder.ts: bind(...), case for SyntaxKind.Block
                return !ts.isFunctionLike(parentNode);
        }
        return false;
    }
    export function isDeclarationWithTypeParameters(node: ts.Node): node is ts.DeclarationWithTypeParameters;
    export function isDeclarationWithTypeParameters(node: ts.DeclarationWithTypeParameters): node is ts.DeclarationWithTypeParameters {
        switch (node.kind) {
            case ts.SyntaxKind.JSDocCallbackTag:
            case ts.SyntaxKind.JSDocTypedefTag:
            case ts.SyntaxKind.JSDocSignature:
                return true;
            default:
                ts.assertType<ts.DeclarationWithTypeParameterChildren>(node);
                return isDeclarationWithTypeParameterChildren(node);
        }
    }
    export function isDeclarationWithTypeParameterChildren(node: ts.Node): node is ts.DeclarationWithTypeParameterChildren;
    export function isDeclarationWithTypeParameterChildren(node: ts.DeclarationWithTypeParameterChildren): node is ts.DeclarationWithTypeParameterChildren {
        switch (node.kind) {
            case ts.SyntaxKind.CallSignature:
            case ts.SyntaxKind.ConstructSignature:
            case ts.SyntaxKind.MethodSignature:
            case ts.SyntaxKind.IndexSignature:
            case ts.SyntaxKind.FunctionType:
            case ts.SyntaxKind.ConstructorType:
            case ts.SyntaxKind.JSDocFunctionType:
            case ts.SyntaxKind.ClassDeclaration:
            case ts.SyntaxKind.ClassExpression:
            case ts.SyntaxKind.InterfaceDeclaration:
            case ts.SyntaxKind.TypeAliasDeclaration:
            case ts.SyntaxKind.JSDocTemplateTag:
            case ts.SyntaxKind.FunctionDeclaration:
            case ts.SyntaxKind.MethodDeclaration:
            case ts.SyntaxKind.Constructor:
            case ts.SyntaxKind.GetAccessor:
            case ts.SyntaxKind.SetAccessor:
            case ts.SyntaxKind.FunctionExpression:
            case ts.SyntaxKind.ArrowFunction:
                return true;
            default:
                ts.assertType<never>(node);
                return false;
        }
    }
    export function isAnyImportSyntax(node: ts.Node): node is ts.AnyImportSyntax {
        switch (node.kind) {
            case ts.SyntaxKind.ImportDeclaration:
            case ts.SyntaxKind.ImportEqualsDeclaration:
                return true;
            default:
                return false;
        }
    }
    export function isLateVisibilityPaintedStatement(node: ts.Node): node is ts.LateVisibilityPaintedStatement {
        switch (node.kind) {
            case ts.SyntaxKind.ImportDeclaration:
            case ts.SyntaxKind.ImportEqualsDeclaration:
            case ts.SyntaxKind.VariableStatement:
            case ts.SyntaxKind.ClassDeclaration:
            case ts.SyntaxKind.FunctionDeclaration:
            case ts.SyntaxKind.ModuleDeclaration:
            case ts.SyntaxKind.TypeAliasDeclaration:
            case ts.SyntaxKind.InterfaceDeclaration:
            case ts.SyntaxKind.EnumDeclaration:
                return true;
            default:
                return false;
        }
    }
    export function isAnyImportOrReExport(node: ts.Node): node is ts.AnyImportOrReExport {
        return isAnyImportSyntax(node) || ts.isExportDeclaration(node);
    }
    // Gets the nearest enclosing block scope container that has the provided node
    // as a descendant, that is not the provided node.
    export function getEnclosingBlockScopeContainer(node: ts.Node): ts.Node {
        return findAncestor(node.parent, current => isBlockScope(current, current.parent))!;
    }
    // Return display name of an identifier
    // Computed property names will just be emitted as "[<expr>]", where <expr> is the source
    // text of the expression in the computed property.
    export function declarationNameToString(name: ts.DeclarationName | ts.QualifiedName | undefined) {
        return !name || getFullWidth(name) === 0 ? "(Missing)" : getTextOfNode(name);
    }
    export function getNameFromIndexInfo(info: ts.IndexInfo): string | undefined {
        return info.declaration ? declarationNameToString(info.declaration.parameters[0].name) : undefined;
    }
    export function getTextOfPropertyName(name: ts.PropertyName | ts.NoSubstitutionTemplateLiteral): ts.__String {
        switch (name.kind) {
            case ts.SyntaxKind.Identifier:
                return name.escapedText;
            case ts.SyntaxKind.StringLiteral:
            case ts.SyntaxKind.NumericLiteral:
            case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
                return ts.escapeLeadingUnderscores(name.text);
            case ts.SyntaxKind.ComputedPropertyName:
                if (isStringOrNumericLiteralLike(name.expression))
                    return ts.escapeLeadingUnderscores(name.expression.text);
                return ts.Debug.fail("Text of property name cannot be read from non-literal-valued ComputedPropertyNames");
            default:
                return ts.Debug.assertNever(name);
        }
    }
    export function entityNameToString(name: ts.EntityNameOrEntityNameExpression): string {
        switch (name.kind) {
            case ts.SyntaxKind.Identifier:
                return getFullWidth(name) === 0 ? ts.idText(name) : getTextOfNode(name);
            case ts.SyntaxKind.QualifiedName:
                return entityNameToString(name.left) + "." + entityNameToString(name.right);
            case ts.SyntaxKind.PropertyAccessExpression:
                return entityNameToString(name.expression) + "." + entityNameToString(name.name);
            default:
                throw ts.Debug.assertNever(name);
        }
    }
    export function createDiagnosticForNode(node: ts.Node, message: ts.DiagnosticMessage, arg0?: string | number, arg1?: string | number, arg2?: string | number, arg3?: string | number): ts.DiagnosticWithLocation {
        const sourceFile = getSourceFileOfNode(node);
        return createDiagnosticForNodeInSourceFile(sourceFile, node, message, arg0, arg1, arg2, arg3);
    }
    export function createDiagnosticForNodeArray(sourceFile: ts.SourceFile, nodes: ts.NodeArray<ts.Node>, message: ts.DiagnosticMessage, arg0?: string | number, arg1?: string | number, arg2?: string | number, arg3?: string | number): ts.DiagnosticWithLocation {
        const start = ts.skipTrivia(sourceFile.text, nodes.pos);
        return createFileDiagnostic(sourceFile, start, nodes.end - start, message, arg0, arg1, arg2, arg3);
    }
    export function createDiagnosticForNodeInSourceFile(sourceFile: ts.SourceFile, node: ts.Node, message: ts.DiagnosticMessage, arg0?: string | number, arg1?: string | number, arg2?: string | number, arg3?: string | number): ts.DiagnosticWithLocation {
        const span = getErrorSpanForNode(sourceFile, node);
        return createFileDiagnostic(sourceFile, span.start, span.length, message, arg0, arg1, arg2, arg3);
    }
    export function createDiagnosticForNodeFromMessageChain(node: ts.Node, messageChain: ts.DiagnosticMessageChain, relatedInformation?: ts.DiagnosticRelatedInformation[]): ts.DiagnosticWithLocation {
        const sourceFile = getSourceFileOfNode(node);
        const span = getErrorSpanForNode(sourceFile, node);
        return {
            file: sourceFile,
            start: span.start,
            length: span.length,
            code: messageChain.code,
            category: messageChain.category,
            messageText: messageChain.next ? messageChain : messageChain.messageText,
            relatedInformation
        };
    }
    export function getSpanOfTokenAtPosition(sourceFile: ts.SourceFile, pos: number): ts.TextSpan {
        const scanner = ts.createScanner(sourceFile.languageVersion, /*skipTrivia*/ true, sourceFile.languageVariant, sourceFile.text, /*onError:*/ undefined, pos);
        scanner.scan();
        const start = scanner.getTokenPos();
        return ts.createTextSpanFromBounds(start, scanner.getTextPos());
    }
    function getErrorSpanForArrowFunction(sourceFile: ts.SourceFile, node: ts.ArrowFunction): ts.TextSpan {
        const pos = ts.skipTrivia(sourceFile.text, node.pos);
        if (node.body && node.body.kind === ts.SyntaxKind.Block) {
            const { line: startLine } = ts.getLineAndCharacterOfPosition(sourceFile, node.body.pos);
            const { line: endLine } = ts.getLineAndCharacterOfPosition(sourceFile, node.body.end);
            if (startLine < endLine) {
                // The arrow function spans multiple lines,
                // make the error span be the first line, inclusive.
                return ts.createTextSpan(pos, getEndLinePosition(startLine, sourceFile) - pos + 1);
            }
        }
        return ts.createTextSpanFromBounds(pos, node.end);
    }
    export function getErrorSpanForNode(sourceFile: ts.SourceFile, node: ts.Node): ts.TextSpan {
        let errorNode: ts.Node | undefined = node;
        switch (node.kind) {
            case ts.SyntaxKind.SourceFile:
                const pos = ts.skipTrivia(sourceFile.text, 0, /*stopAfterLineBreak*/ false);
                if (pos === sourceFile.text.length) {
                    // file is empty - return span for the beginning of the file
                    return ts.createTextSpan(0, 0);
                }
                return getSpanOfTokenAtPosition(sourceFile, pos);
            // This list is a work in progress. Add missing node kinds to improve their error
            // spans.
            case ts.SyntaxKind.VariableDeclaration:
            case ts.SyntaxKind.BindingElement:
            case ts.SyntaxKind.ClassDeclaration:
            case ts.SyntaxKind.ClassExpression:
            case ts.SyntaxKind.InterfaceDeclaration:
            case ts.SyntaxKind.ModuleDeclaration:
            case ts.SyntaxKind.EnumDeclaration:
            case ts.SyntaxKind.EnumMember:
            case ts.SyntaxKind.FunctionDeclaration:
            case ts.SyntaxKind.FunctionExpression:
            case ts.SyntaxKind.MethodDeclaration:
            case ts.SyntaxKind.GetAccessor:
            case ts.SyntaxKind.SetAccessor:
            case ts.SyntaxKind.TypeAliasDeclaration:
            case ts.SyntaxKind.PropertyDeclaration:
            case ts.SyntaxKind.PropertySignature:
                errorNode = (<ts.NamedDeclaration>node).name;
                break;
            case ts.SyntaxKind.ArrowFunction:
                return getErrorSpanForArrowFunction(sourceFile, (<ts.ArrowFunction>node));
            case ts.SyntaxKind.CaseClause:
            case ts.SyntaxKind.DefaultClause:
                const start = ts.skipTrivia(sourceFile.text, (<ts.CaseOrDefaultClause>node).pos);
                const end = (<ts.CaseOrDefaultClause>node).statements.length > 0 ? (<ts.CaseOrDefaultClause>node).statements[0].pos : (<ts.CaseOrDefaultClause>node).end;
                return ts.createTextSpanFromBounds(start, end);
        }
        if (errorNode === undefined) {
            // If we don't have a better node, then just set the error on the first token of
            // construct.
            return getSpanOfTokenAtPosition(sourceFile, node.pos);
        }
        ts.Debug.assert(!ts.isJSDoc(errorNode));
        const isMissing = nodeIsMissing(errorNode);
        const pos = isMissing || ts.isJsxText(node)
            ? errorNode.pos
            : ts.skipTrivia(sourceFile.text, errorNode.pos);
        // These asserts should all be satisfied for a properly constructed `errorNode`.
        if (isMissing) {
            ts.Debug.assert(pos === errorNode.pos, "This failure could trigger https://github.com/Microsoft/TypeScript/issues/20809");
            ts.Debug.assert(pos === errorNode.end, "This failure could trigger https://github.com/Microsoft/TypeScript/issues/20809");
        }
        else {
            ts.Debug.assert(pos >= errorNode.pos, "This failure could trigger https://github.com/Microsoft/TypeScript/issues/20809");
            ts.Debug.assert(pos <= errorNode.end, "This failure could trigger https://github.com/Microsoft/TypeScript/issues/20809");
        }
        return ts.createTextSpanFromBounds(pos, errorNode.end);
    }
    export function isExternalOrCommonJsModule(file: ts.SourceFile): boolean {
        return (file.externalModuleIndicator || file.commonJsModuleIndicator) !== undefined;
    }
    export function isJsonSourceFile(file: ts.SourceFile): file is ts.JsonSourceFile {
        return file.scriptKind === ts.ScriptKind.JSON;
    }
    export function isEnumConst(node: ts.EnumDeclaration): boolean {
        return !!(ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Const);
    }
    export function isDeclarationReadonly(declaration: ts.Declaration): boolean {
        return !!(ts.getCombinedModifierFlags(declaration) & ts.ModifierFlags.Readonly && !ts.isParameterPropertyDeclaration(declaration, declaration.parent));
    }
    export function isVarConst(node: ts.VariableDeclaration | ts.VariableDeclarationList): boolean {
        return !!(ts.getCombinedNodeFlags(node) & ts.NodeFlags.Const);
    }
    export function isLet(node: ts.Node): boolean {
        return !!(ts.getCombinedNodeFlags(node) & ts.NodeFlags.Let);
    }
    export function isSuperCall(n: ts.Node): n is ts.SuperCall {
        return n.kind === ts.SyntaxKind.CallExpression && (<ts.CallExpression>n).expression.kind === ts.SyntaxKind.SuperKeyword;
    }
    export function isImportCall(n: ts.Node): n is ts.ImportCall {
        return n.kind === ts.SyntaxKind.CallExpression && (<ts.CallExpression>n).expression.kind === ts.SyntaxKind.ImportKeyword;
    }
    export function isImportMeta(n: ts.Node): n is ts.ImportMetaProperty {
        return ts.isMetaProperty(n)
            && n.keywordToken === ts.SyntaxKind.ImportKeyword
            && n.name.escapedText === "meta";
    }
    export function isLiteralImportTypeNode(n: ts.Node): n is ts.LiteralImportTypeNode {
        return ts.isImportTypeNode(n) && ts.isLiteralTypeNode(n.argument) && ts.isStringLiteral(n.argument.literal);
    }
    export function isPrologueDirective(node: ts.Node): node is ts.PrologueDirective {
        return node.kind === ts.SyntaxKind.ExpressionStatement
            && (<ts.ExpressionStatement>node).expression.kind === ts.SyntaxKind.StringLiteral;
    }
    export function getLeadingCommentRangesOfNode(node: ts.Node, sourceFileOfNode: ts.SourceFile) {
        return node.kind !== ts.SyntaxKind.JsxText ? ts.getLeadingCommentRanges(sourceFileOfNode.text, node.pos) : undefined;
    }
    export function getJSDocCommentRanges(node: ts.Node, text: string) {
        const commentRanges = (node.kind === ts.SyntaxKind.Parameter ||
            node.kind === ts.SyntaxKind.TypeParameter ||
            node.kind === ts.SyntaxKind.FunctionExpression ||
            node.kind === ts.SyntaxKind.ArrowFunction ||
            node.kind === ts.SyntaxKind.ParenthesizedExpression) ?
            ts.concatenate(ts.getTrailingCommentRanges(text, node.pos), ts.getLeadingCommentRanges(text, node.pos)) :
            ts.getLeadingCommentRanges(text, node.pos);
        // True if the comment starts with '/**' but not if it is '/**/'
        return ts.filter(commentRanges, comment => text.charCodeAt(comment.pos + 1) === ts.CharacterCodes.asterisk &&
            text.charCodeAt(comment.pos + 2) === ts.CharacterCodes.asterisk &&
            text.charCodeAt(comment.pos + 3) !== ts.CharacterCodes.slash);
    }
    export const fullTripleSlashReferencePathRegEx = /^(\/\/\/\s*<reference\s+path\s*=\s*)('|")(.+?)\2.*?\/>/;
    const fullTripleSlashReferenceTypeReferenceDirectiveRegEx = /^(\/\/\/\s*<reference\s+types\s*=\s*)('|")(.+?)\2.*?\/>/;
    export const fullTripleSlashAMDReferencePathRegEx = /^(\/\/\/\s*<amd-dependency\s+path\s*=\s*)('|")(.+?)\2.*?\/>/;
    const defaultLibReferenceRegEx = /^(\/\/\/\s*<reference\s+no-default-lib\s*=\s*)('|")(.+?)\2\s*\/>/;
    export function isPartOfTypeNode(node: ts.Node): boolean {
        if (ts.SyntaxKind.FirstTypeNode <= node.kind && node.kind <= ts.SyntaxKind.LastTypeNode) {
            return true;
        }
        switch (node.kind) {
            case ts.SyntaxKind.AnyKeyword:
            case ts.SyntaxKind.UnknownKeyword:
            case ts.SyntaxKind.NumberKeyword:
            case ts.SyntaxKind.BigIntKeyword:
            case ts.SyntaxKind.StringKeyword:
            case ts.SyntaxKind.BooleanKeyword:
            case ts.SyntaxKind.SymbolKeyword:
            case ts.SyntaxKind.ObjectKeyword:
            case ts.SyntaxKind.UndefinedKeyword:
            case ts.SyntaxKind.NeverKeyword:
                return true;
            case ts.SyntaxKind.VoidKeyword:
                return node.parent.kind !== ts.SyntaxKind.VoidExpression;
            case ts.SyntaxKind.ExpressionWithTypeArguments:
                return !isExpressionWithTypeArgumentsInClassExtendsClause(node);
            case ts.SyntaxKind.TypeParameter:
                return node.parent.kind === ts.SyntaxKind.MappedType || node.parent.kind === ts.SyntaxKind.InferType;
            // Identifiers and qualified names may be type nodes, depending on their context. Climb
            // above them to find the lowest container
            case ts.SyntaxKind.Identifier:
                // If the identifier is the RHS of a qualified name, then it's a type iff its parent is.
                if (node.parent.kind === ts.SyntaxKind.QualifiedName && (<ts.QualifiedName>node.parent).right === node) {
                    node = node.parent;
                }
                else if (node.parent.kind === ts.SyntaxKind.PropertyAccessExpression && (<ts.PropertyAccessExpression>node.parent).name === node) {
                    node = node.parent;
                }
                // At this point, node is either a qualified name or an identifier
                ts.Debug.assert(node.kind === ts.SyntaxKind.Identifier || node.kind === ts.SyntaxKind.QualifiedName || node.kind === ts.SyntaxKind.PropertyAccessExpression, "'node' was expected to be a qualified name, identifier or property access in 'isPartOfTypeNode'.");
            // falls through
            case ts.SyntaxKind.QualifiedName:
            case ts.SyntaxKind.PropertyAccessExpression:
            case ts.SyntaxKind.ThisKeyword: {
                const { parent } = node;
                if (parent.kind === ts.SyntaxKind.TypeQuery) {
                    return false;
                }
                if (parent.kind === ts.SyntaxKind.ImportType) {
                    return !(parent as ts.ImportTypeNode).isTypeOf;
                }
                // Do not recursively call isPartOfTypeNode on the parent. In the example:
                //
                //     let a: A.B.C;
                //
                // Calling isPartOfTypeNode would consider the qualified name A.B a type node.
                // Only C and A.B.C are type nodes.
                if (ts.SyntaxKind.FirstTypeNode <= parent.kind && parent.kind <= ts.SyntaxKind.LastTypeNode) {
                    return true;
                }
                switch (parent.kind) {
                    case ts.SyntaxKind.ExpressionWithTypeArguments:
                        return !isExpressionWithTypeArgumentsInClassExtendsClause(parent);
                    case ts.SyntaxKind.TypeParameter:
                        return node === (<ts.TypeParameterDeclaration>parent).constraint;
                    case ts.SyntaxKind.JSDocTemplateTag:
                        return node === (<ts.JSDocTemplateTag>parent).constraint;
                    case ts.SyntaxKind.PropertyDeclaration:
                    case ts.SyntaxKind.PropertySignature:
                    case ts.SyntaxKind.Parameter:
                    case ts.SyntaxKind.VariableDeclaration:
                        return node === (parent as ts.HasType).type;
                    case ts.SyntaxKind.FunctionDeclaration:
                    case ts.SyntaxKind.FunctionExpression:
                    case ts.SyntaxKind.ArrowFunction:
                    case ts.SyntaxKind.Constructor:
                    case ts.SyntaxKind.MethodDeclaration:
                    case ts.SyntaxKind.MethodSignature:
                    case ts.SyntaxKind.GetAccessor:
                    case ts.SyntaxKind.SetAccessor:
                        return node === (<ts.FunctionLikeDeclaration>parent).type;
                    case ts.SyntaxKind.CallSignature:
                    case ts.SyntaxKind.ConstructSignature:
                    case ts.SyntaxKind.IndexSignature:
                        return node === (<ts.SignatureDeclaration>parent).type;
                    case ts.SyntaxKind.TypeAssertionExpression:
                        return node === (<ts.TypeAssertion>parent).type;
                    case ts.SyntaxKind.CallExpression:
                    case ts.SyntaxKind.NewExpression:
                        return ts.contains((<ts.CallExpression>parent).typeArguments, node);
                    case ts.SyntaxKind.TaggedTemplateExpression:
                        // TODO (drosen): TaggedTemplateExpressions may eventually support type arguments.
                        return false;
                }
            }
        }
        return false;
    }
    export function isChildOfNodeWithKind(node: ts.Node, kind: ts.SyntaxKind): boolean {
        while (node) {
            if (node.kind === kind) {
                return true;
            }
            node = node.parent;
        }
        return false;
    }
    // Warning: This has the same semantics as the forEach family of functions,
    //          in that traversal terminates in the event that 'visitor' supplies a truthy value.
    export function forEachReturnStatement<T>(body: ts.Block, visitor: (stmt: ts.ReturnStatement) => T): T | undefined {
        return traverse(body);
        function traverse(node: ts.Node): T | undefined {
            switch (node.kind) {
                case ts.SyntaxKind.ReturnStatement:
                    return visitor((<ts.ReturnStatement>node));
                case ts.SyntaxKind.CaseBlock:
                case ts.SyntaxKind.Block:
                case ts.SyntaxKind.IfStatement:
                case ts.SyntaxKind.DoStatement:
                case ts.SyntaxKind.WhileStatement:
                case ts.SyntaxKind.ForStatement:
                case ts.SyntaxKind.ForInStatement:
                case ts.SyntaxKind.ForOfStatement:
                case ts.SyntaxKind.WithStatement:
                case ts.SyntaxKind.SwitchStatement:
                case ts.SyntaxKind.CaseClause:
                case ts.SyntaxKind.DefaultClause:
                case ts.SyntaxKind.LabeledStatement:
                case ts.SyntaxKind.TryStatement:
                case ts.SyntaxKind.CatchClause:
                    return ts.forEachChild(node, traverse);
            }
        }
    }
    export function forEachYieldExpression(body: ts.Block, visitor: (expr: ts.YieldExpression) => void): void {
        return traverse(body);
        function traverse(node: ts.Node): void {
            switch (node.kind) {
                case ts.SyntaxKind.YieldExpression:
                    visitor((<ts.YieldExpression>node));
                    const operand = (<ts.YieldExpression>node).expression;
                    if (operand) {
                        traverse(operand);
                    }
                    return;
                case ts.SyntaxKind.EnumDeclaration:
                case ts.SyntaxKind.InterfaceDeclaration:
                case ts.SyntaxKind.ModuleDeclaration:
                case ts.SyntaxKind.TypeAliasDeclaration:
                    // These are not allowed inside a generator now, but eventually they may be allowed
                    // as local types. Regardless, skip them to avoid the work.
                    return;
                default:
                    if (ts.isFunctionLike(node)) {
                        if (node.name && node.name.kind === ts.SyntaxKind.ComputedPropertyName) {
                            // Note that we will not include methods/accessors of a class because they would require
                            // first descending into the class. This is by design.
                            traverse(node.name.expression);
                            return;
                        }
                    }
                    else if (!isPartOfTypeNode(node)) {
                        // This is the general case, which should include mostly expressions and statements.
                        // Also includes NodeArrays.
                        ts.forEachChild(node, traverse);
                    }
            }
        }
    }
    /**
     * Gets the most likely element type for a TypeNode. This is not an exhaustive test
     * as it assumes a rest argument can only be an array type (either T[], or Array<T>).
     *
     * @param node The type node.
     */
    export function getRestParameterElementType(node: ts.TypeNode | undefined) {
        if (node && node.kind === ts.SyntaxKind.ArrayType) {
            return (<ts.ArrayTypeNode>node).elementType;
        }
        else if (node && node.kind === ts.SyntaxKind.TypeReference) {
            return ts.singleOrUndefined((<ts.TypeReferenceNode>node).typeArguments);
        }
        else {
            return undefined;
        }
    }
    export function getMembersOfDeclaration(node: ts.Declaration): ts.NodeArray<ts.ClassElement | ts.TypeElement | ts.ObjectLiteralElement> | undefined {
        switch (node.kind) {
            case ts.SyntaxKind.InterfaceDeclaration:
            case ts.SyntaxKind.ClassDeclaration:
            case ts.SyntaxKind.ClassExpression:
            case ts.SyntaxKind.TypeLiteral:
                return (<ts.ObjectTypeDeclaration>node).members;
            case ts.SyntaxKind.ObjectLiteralExpression:
                return (<ts.ObjectLiteralExpression>node).properties;
        }
    }
    export function isVariableLike(node: ts.Node): node is ts.VariableLikeDeclaration {
        if (node) {
            switch (node.kind) {
                case ts.SyntaxKind.BindingElement:
                case ts.SyntaxKind.EnumMember:
                case ts.SyntaxKind.Parameter:
                case ts.SyntaxKind.PropertyAssignment:
                case ts.SyntaxKind.PropertyDeclaration:
                case ts.SyntaxKind.PropertySignature:
                case ts.SyntaxKind.ShorthandPropertyAssignment:
                case ts.SyntaxKind.VariableDeclaration:
                    return true;
            }
        }
        return false;
    }
    export function isVariableLikeOrAccessor(node: ts.Node): node is ts.AccessorDeclaration | ts.VariableLikeDeclaration {
        return isVariableLike(node) || ts.isAccessor(node);
    }
    export function isVariableDeclarationInVariableStatement(node: ts.VariableDeclaration) {
        return node.parent.kind === ts.SyntaxKind.VariableDeclarationList
            && node.parent.parent.kind === ts.SyntaxKind.VariableStatement;
    }
    export function isValidESSymbolDeclaration(node: ts.Node): node is ts.VariableDeclaration | ts.PropertyDeclaration | ts.SignatureDeclaration {
        return ts.isVariableDeclaration(node) ? isVarConst(node) && ts.isIdentifier(node.name) && isVariableDeclarationInVariableStatement(node) :
            ts.isPropertyDeclaration(node) ? hasReadonlyModifier(node) && hasStaticModifier(node) :
                ts.isPropertySignature(node) && hasReadonlyModifier(node);
    }
    export function introducesArgumentsExoticObject(node: ts.Node) {
        switch (node.kind) {
            case ts.SyntaxKind.MethodDeclaration:
            case ts.SyntaxKind.MethodSignature:
            case ts.SyntaxKind.Constructor:
            case ts.SyntaxKind.GetAccessor:
            case ts.SyntaxKind.SetAccessor:
            case ts.SyntaxKind.FunctionDeclaration:
            case ts.SyntaxKind.FunctionExpression:
                return true;
        }
        return false;
    }
    export function unwrapInnermostStatementOfLabel(node: ts.LabeledStatement, beforeUnwrapLabelCallback?: (node: ts.LabeledStatement) => void): ts.Statement {
        while (true) {
            if (beforeUnwrapLabelCallback) {
                beforeUnwrapLabelCallback(node);
            }
            if (node.statement.kind !== ts.SyntaxKind.LabeledStatement) {
                return node.statement;
            }
            node = (<ts.LabeledStatement>node.statement);
        }
    }
    export function isFunctionBlock(node: ts.Node): boolean {
        return node && node.kind === ts.SyntaxKind.Block && ts.isFunctionLike(node.parent);
    }
    export function isObjectLiteralMethod(node: ts.Node): node is ts.MethodDeclaration {
        return node && node.kind === ts.SyntaxKind.MethodDeclaration && node.parent.kind === ts.SyntaxKind.ObjectLiteralExpression;
    }
    export function isObjectLiteralOrClassExpressionMethod(node: ts.Node): node is ts.MethodDeclaration {
        return node.kind === ts.SyntaxKind.MethodDeclaration &&
            (node.parent.kind === ts.SyntaxKind.ObjectLiteralExpression ||
                node.parent.kind === ts.SyntaxKind.ClassExpression);
    }
    export function isIdentifierTypePredicate(predicate: ts.TypePredicate): predicate is ts.IdentifierTypePredicate {
        return predicate && predicate.kind === ts.TypePredicateKind.Identifier;
    }
    export function isThisTypePredicate(predicate: ts.TypePredicate): predicate is ts.ThisTypePredicate {
        return predicate && predicate.kind === ts.TypePredicateKind.This;
    }
    export function getPropertyAssignment(objectLiteral: ts.ObjectLiteralExpression, key: string, key2?: string): readonly ts.PropertyAssignment[] {
        return objectLiteral.properties.filter((property): property is ts.PropertyAssignment => {
            if (property.kind === ts.SyntaxKind.PropertyAssignment) {
                const propName = getTextOfPropertyName(property.name);
                return key === propName || (!!key2 && key2 === propName);
            }
            return false;
        });
    }
    export function getTsConfigObjectLiteralExpression(tsConfigSourceFile: ts.TsConfigSourceFile | undefined): ts.ObjectLiteralExpression | undefined {
        if (tsConfigSourceFile && tsConfigSourceFile.statements.length) {
            const expression = tsConfigSourceFile.statements[0].expression;
            return ts.tryCast(expression, ts.isObjectLiteralExpression);
        }
    }
    export function getTsConfigPropArrayElementValue(tsConfigSourceFile: ts.TsConfigSourceFile | undefined, propKey: string, elementValue: string): ts.StringLiteral | undefined {
        return ts.firstDefined(getTsConfigPropArray(tsConfigSourceFile, propKey), property => ts.isArrayLiteralExpression(property.initializer) ?
            ts.find(property.initializer.elements, (element): element is ts.StringLiteral => ts.isStringLiteral(element) && element.text === elementValue) :
            undefined);
    }
    export function getTsConfigPropArray(tsConfigSourceFile: ts.TsConfigSourceFile | undefined, propKey: string): readonly ts.PropertyAssignment[] {
        const jsonObjectLiteral = getTsConfigObjectLiteralExpression(tsConfigSourceFile);
        return jsonObjectLiteral ? getPropertyAssignment(jsonObjectLiteral, propKey) : ts.emptyArray;
    }
    export function getContainingFunction(node: ts.Node): ts.SignatureDeclaration | undefined {
        return findAncestor(node.parent, ts.isFunctionLike);
    }
    export function getContainingFunctionDeclaration(node: ts.Node): ts.FunctionLikeDeclaration | undefined {
        return findAncestor(node.parent, ts.isFunctionLikeDeclaration);
    }
    export function getContainingClass(node: ts.Node): ts.ClassLikeDeclaration | undefined {
        return findAncestor(node.parent, ts.isClassLike);
    }
    export function getThisContainer(node: ts.Node, includeArrowFunctions: boolean): ts.Node {
        ts.Debug.assert(node.kind !== ts.SyntaxKind.SourceFile);
        while (true) {
            node = node.parent;
            if (!node) {
                return ts.Debug.fail(); // If we never pass in a SourceFile, this should be unreachable, since we'll stop when we reach that.
            }
            switch (node.kind) {
                case ts.SyntaxKind.ComputedPropertyName:
                    // If the grandparent node is an object literal (as opposed to a class),
                    // then the computed property is not a 'this' container.
                    // A computed property name in a class needs to be a this container
                    // so that we can error on it.
                    if (ts.isClassLike(node.parent.parent)) {
                        return node;
                    }
                    // If this is a computed property, then the parent should not
                    // make it a this container. The parent might be a property
                    // in an object literal, like a method or accessor. But in order for
                    // such a parent to be a this container, the reference must be in
                    // the *body* of the container.
                    node = node.parent;
                    break;
                case ts.SyntaxKind.Decorator:
                    // Decorators are always applied outside of the body of a class or method.
                    if (node.parent.kind === ts.SyntaxKind.Parameter && ts.isClassElement(node.parent.parent)) {
                        // If the decorator's parent is a Parameter, we resolve the this container from
                        // the grandparent class declaration.
                        node = node.parent.parent;
                    }
                    else if (ts.isClassElement(node.parent)) {
                        // If the decorator's parent is a class element, we resolve the 'this' container
                        // from the parent class declaration.
                        node = node.parent;
                    }
                    break;
                case ts.SyntaxKind.ArrowFunction:
                    if (!includeArrowFunctions) {
                        continue;
                    }
                // falls through
                case ts.SyntaxKind.FunctionDeclaration:
                case ts.SyntaxKind.FunctionExpression:
                case ts.SyntaxKind.ModuleDeclaration:
                case ts.SyntaxKind.PropertyDeclaration:
                case ts.SyntaxKind.PropertySignature:
                case ts.SyntaxKind.MethodDeclaration:
                case ts.SyntaxKind.MethodSignature:
                case ts.SyntaxKind.Constructor:
                case ts.SyntaxKind.GetAccessor:
                case ts.SyntaxKind.SetAccessor:
                case ts.SyntaxKind.CallSignature:
                case ts.SyntaxKind.ConstructSignature:
                case ts.SyntaxKind.IndexSignature:
                case ts.SyntaxKind.EnumDeclaration:
                case ts.SyntaxKind.SourceFile:
                    return node;
            }
        }
    }
    export function getNewTargetContainer(node: ts.Node) {
        const container = getThisContainer(node, /*includeArrowFunctions*/ false);
        if (container) {
            switch (container.kind) {
                case ts.SyntaxKind.Constructor:
                case ts.SyntaxKind.FunctionDeclaration:
                case ts.SyntaxKind.FunctionExpression:
                    return container;
            }
        }
        return undefined;
    }
    /**
     * Given an super call/property node, returns the closest node where
     * - a super call/property access is legal in the node and not legal in the parent node the node.
     *   i.e. super call is legal in constructor but not legal in the class body.
     * - the container is an arrow function (so caller might need to call getSuperContainer again in case it needs to climb higher)
     * - a super call/property is definitely illegal in the container (but might be legal in some subnode)
     *   i.e. super property access is illegal in function declaration but can be legal in the statement list
     */
    export function getSuperContainer(node: ts.Node, stopOnFunctions: boolean): ts.Node {
        while (true) {
            node = node.parent;
            if (!node) {
                return node;
            }
            switch (node.kind) {
                case ts.SyntaxKind.ComputedPropertyName:
                    node = node.parent;
                    break;
                case ts.SyntaxKind.FunctionDeclaration:
                case ts.SyntaxKind.FunctionExpression:
                case ts.SyntaxKind.ArrowFunction:
                    if (!stopOnFunctions) {
                        continue;
                    }
                // falls through
                case ts.SyntaxKind.PropertyDeclaration:
                case ts.SyntaxKind.PropertySignature:
                case ts.SyntaxKind.MethodDeclaration:
                case ts.SyntaxKind.MethodSignature:
                case ts.SyntaxKind.Constructor:
                case ts.SyntaxKind.GetAccessor:
                case ts.SyntaxKind.SetAccessor:
                    return node;
                case ts.SyntaxKind.Decorator:
                    // Decorators are always applied outside of the body of a class or method.
                    if (node.parent.kind === ts.SyntaxKind.Parameter && ts.isClassElement(node.parent.parent)) {
                        // If the decorator's parent is a Parameter, we resolve the this container from
                        // the grandparent class declaration.
                        node = node.parent.parent;
                    }
                    else if (ts.isClassElement(node.parent)) {
                        // If the decorator's parent is a class element, we resolve the 'this' container
                        // from the parent class declaration.
                        node = node.parent;
                    }
                    break;
            }
        }
    }
    export function getImmediatelyInvokedFunctionExpression(func: ts.Node): ts.CallExpression | undefined {
        if (func.kind === ts.SyntaxKind.FunctionExpression || func.kind === ts.SyntaxKind.ArrowFunction) {
            let prev = func;
            let parent = func.parent;
            while (parent.kind === ts.SyntaxKind.ParenthesizedExpression) {
                prev = parent;
                parent = parent.parent;
            }
            if (parent.kind === ts.SyntaxKind.CallExpression && (parent as ts.CallExpression).expression === prev) {
                return parent as ts.CallExpression;
            }
        }
    }
    export function isSuperOrSuperProperty(node: ts.Node): node is ts.SuperExpression | ts.SuperProperty {
        return node.kind === ts.SyntaxKind.SuperKeyword
            || isSuperProperty(node);
    }
    /**
     * Determines whether a node is a property or element access expression for `super`.
     */
    export function isSuperProperty(node: ts.Node): node is ts.SuperProperty {
        const kind = node.kind;
        return (kind === ts.SyntaxKind.PropertyAccessExpression || kind === ts.SyntaxKind.ElementAccessExpression)
            && (<ts.PropertyAccessExpression | ts.ElementAccessExpression>node).expression.kind === ts.SyntaxKind.SuperKeyword;
    }
    /**
     * Determines whether a node is a property or element access expression for `this`.
     */
    export function isThisProperty(node: ts.Node): boolean {
        const kind = node.kind;
        return (kind === ts.SyntaxKind.PropertyAccessExpression || kind === ts.SyntaxKind.ElementAccessExpression)
            && (<ts.PropertyAccessExpression | ts.ElementAccessExpression>node).expression.kind === ts.SyntaxKind.ThisKeyword;
    }
    export function getEntityNameFromTypeNode(node: ts.TypeNode): ts.EntityNameOrEntityNameExpression | undefined {
        switch (node.kind) {
            case ts.SyntaxKind.TypeReference:
                return (<ts.TypeReferenceNode>node).typeName;
            case ts.SyntaxKind.ExpressionWithTypeArguments:
                return isEntityNameExpression((<ts.ExpressionWithTypeArguments>node).expression)
                    ? <ts.EntityNameExpression>(<ts.ExpressionWithTypeArguments>node).expression
                    : undefined;
            case ts.SyntaxKind.Identifier:
            case ts.SyntaxKind.QualifiedName:
                return (<ts.EntityName><ts.Node>node);
        }
        return undefined;
    }
    export function getInvokedExpression(node: ts.CallLikeExpression): ts.Expression {
        switch (node.kind) {
            case ts.SyntaxKind.TaggedTemplateExpression:
                return node.tag;
            case ts.SyntaxKind.JsxOpeningElement:
            case ts.SyntaxKind.JsxSelfClosingElement:
                return node.tagName;
            default:
                return node.expression;
        }
    }
    export function nodeCanBeDecorated(node: ts.ClassDeclaration): true;
    export function nodeCanBeDecorated(node: ts.ClassElement, parent: ts.Node): boolean;
    export function nodeCanBeDecorated(node: ts.Node, parent: ts.Node, grandparent: ts.Node): boolean;
    export function nodeCanBeDecorated(node: ts.Node, parent?: ts.Node, grandparent?: ts.Node): boolean {
        switch (node.kind) {
            case ts.SyntaxKind.ClassDeclaration:
                // classes are valid targets
                return true;
            case ts.SyntaxKind.PropertyDeclaration:
                // property declarations are valid if their parent is a class declaration.
                return parent!.kind === ts.SyntaxKind.ClassDeclaration;
            case ts.SyntaxKind.GetAccessor:
            case ts.SyntaxKind.SetAccessor:
            case ts.SyntaxKind.MethodDeclaration:
                // if this method has a body and its parent is a class declaration, this is a valid target.
                return (<ts.FunctionLikeDeclaration>node).body !== undefined
                    && parent!.kind === ts.SyntaxKind.ClassDeclaration;
            case ts.SyntaxKind.Parameter:
                // if the parameter's parent has a body and its grandparent is a class declaration, this is a valid target;
                return (<ts.FunctionLikeDeclaration>parent).body !== undefined
                    && (parent!.kind === ts.SyntaxKind.Constructor
                        || parent!.kind === ts.SyntaxKind.MethodDeclaration
                        || parent!.kind === ts.SyntaxKind.SetAccessor)
                    && grandparent!.kind === ts.SyntaxKind.ClassDeclaration;
        }
        return false;
    }
    export function nodeIsDecorated(node: ts.ClassDeclaration): boolean;
    export function nodeIsDecorated(node: ts.ClassElement, parent: ts.Node): boolean;
    export function nodeIsDecorated(node: ts.Node, parent: ts.Node, grandparent: ts.Node): boolean;
    export function nodeIsDecorated(node: ts.Node, parent?: ts.Node, grandparent?: ts.Node): boolean {
        return node.decorators !== undefined
            && nodeCanBeDecorated(node, parent!, grandparent!); // TODO: GH#18217
    }
    export function nodeOrChildIsDecorated(node: ts.ClassDeclaration): boolean;
    export function nodeOrChildIsDecorated(node: ts.ClassElement, parent: ts.Node): boolean;
    export function nodeOrChildIsDecorated(node: ts.Node, parent: ts.Node, grandparent: ts.Node): boolean;
    export function nodeOrChildIsDecorated(node: ts.Node, parent?: ts.Node, grandparent?: ts.Node): boolean {
        return nodeIsDecorated(node, parent!, grandparent!) || childIsDecorated(node, parent!); // TODO: GH#18217
    }
    export function childIsDecorated(node: ts.ClassDeclaration): boolean;
    export function childIsDecorated(node: ts.Node, parent: ts.Node): boolean;
    export function childIsDecorated(node: ts.Node, parent?: ts.Node): boolean {
        switch (node.kind) {
            case ts.SyntaxKind.ClassDeclaration:
                return ts.some((<ts.ClassDeclaration>node).members, m => nodeOrChildIsDecorated(m, node, parent!)); // TODO: GH#18217
            case ts.SyntaxKind.MethodDeclaration:
            case ts.SyntaxKind.SetAccessor:
                return ts.some((<ts.FunctionLikeDeclaration>node).parameters, p => nodeIsDecorated(p, node, parent!)); // TODO: GH#18217
            default:
                return false;
        }
    }
    export function isJSXTagName(node: ts.Node) {
        const { parent } = node;
        if (parent.kind === ts.SyntaxKind.JsxOpeningElement ||
            parent.kind === ts.SyntaxKind.JsxSelfClosingElement ||
            parent.kind === ts.SyntaxKind.JsxClosingElement) {
            return (<ts.JsxOpeningLikeElement>parent).tagName === node;
        }
        return false;
    }
    export function isExpressionNode(node: ts.Node): boolean {
        switch (node.kind) {
            case ts.SyntaxKind.SuperKeyword:
            case ts.SyntaxKind.NullKeyword:
            case ts.SyntaxKind.TrueKeyword:
            case ts.SyntaxKind.FalseKeyword:
            case ts.SyntaxKind.RegularExpressionLiteral:
            case ts.SyntaxKind.ArrayLiteralExpression:
            case ts.SyntaxKind.ObjectLiteralExpression:
            case ts.SyntaxKind.PropertyAccessExpression:
            case ts.SyntaxKind.ElementAccessExpression:
            case ts.SyntaxKind.CallExpression:
            case ts.SyntaxKind.NewExpression:
            case ts.SyntaxKind.TaggedTemplateExpression:
            case ts.SyntaxKind.AsExpression:
            case ts.SyntaxKind.TypeAssertionExpression:
            case ts.SyntaxKind.NonNullExpression:
            case ts.SyntaxKind.ParenthesizedExpression:
            case ts.SyntaxKind.FunctionExpression:
            case ts.SyntaxKind.ClassExpression:
            case ts.SyntaxKind.ArrowFunction:
            case ts.SyntaxKind.VoidExpression:
            case ts.SyntaxKind.DeleteExpression:
            case ts.SyntaxKind.TypeOfExpression:
            case ts.SyntaxKind.PrefixUnaryExpression:
            case ts.SyntaxKind.PostfixUnaryExpression:
            case ts.SyntaxKind.BinaryExpression:
            case ts.SyntaxKind.ConditionalExpression:
            case ts.SyntaxKind.SpreadElement:
            case ts.SyntaxKind.TemplateExpression:
            case ts.SyntaxKind.OmittedExpression:
            case ts.SyntaxKind.JsxElement:
            case ts.SyntaxKind.JsxSelfClosingElement:
            case ts.SyntaxKind.JsxFragment:
            case ts.SyntaxKind.YieldExpression:
            case ts.SyntaxKind.AwaitExpression:
            case ts.SyntaxKind.MetaProperty:
                return true;
            case ts.SyntaxKind.QualifiedName:
                while (node.parent.kind === ts.SyntaxKind.QualifiedName) {
                    node = node.parent;
                }
                return node.parent.kind === ts.SyntaxKind.TypeQuery || isJSXTagName(node);
            case ts.SyntaxKind.Identifier:
                if (node.parent.kind === ts.SyntaxKind.TypeQuery || isJSXTagName(node)) {
                    return true;
                }
            // falls through
            case ts.SyntaxKind.NumericLiteral:
            case ts.SyntaxKind.BigIntLiteral:
            case ts.SyntaxKind.StringLiteral:
            case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
            case ts.SyntaxKind.ThisKeyword:
                return isInExpressionContext(node);
            default:
                return false;
        }
    }
    export function isInExpressionContext(node: ts.Node): boolean {
        const { parent } = node;
        switch (parent.kind) {
            case ts.SyntaxKind.VariableDeclaration:
            case ts.SyntaxKind.Parameter:
            case ts.SyntaxKind.PropertyDeclaration:
            case ts.SyntaxKind.PropertySignature:
            case ts.SyntaxKind.EnumMember:
            case ts.SyntaxKind.PropertyAssignment:
            case ts.SyntaxKind.BindingElement:
                return (parent as ts.HasInitializer).initializer === node;
            case ts.SyntaxKind.ExpressionStatement:
            case ts.SyntaxKind.IfStatement:
            case ts.SyntaxKind.DoStatement:
            case ts.SyntaxKind.WhileStatement:
            case ts.SyntaxKind.ReturnStatement:
            case ts.SyntaxKind.WithStatement:
            case ts.SyntaxKind.SwitchStatement:
            case ts.SyntaxKind.CaseClause:
            case ts.SyntaxKind.ThrowStatement:
                return (<ts.ExpressionStatement>parent).expression === node;
            case ts.SyntaxKind.ForStatement:
                const forStatement = (<ts.ForStatement>parent);
                return (forStatement.initializer === node && forStatement.initializer.kind !== ts.SyntaxKind.VariableDeclarationList) ||
                    forStatement.condition === node ||
                    forStatement.incrementor === node;
            case ts.SyntaxKind.ForInStatement:
            case ts.SyntaxKind.ForOfStatement:
                const forInStatement = (<ts.ForInStatement | ts.ForOfStatement>parent);
                return (forInStatement.initializer === node && forInStatement.initializer.kind !== ts.SyntaxKind.VariableDeclarationList) ||
                    forInStatement.expression === node;
            case ts.SyntaxKind.TypeAssertionExpression:
            case ts.SyntaxKind.AsExpression:
                return node === (<ts.AssertionExpression>parent).expression;
            case ts.SyntaxKind.TemplateSpan:
                return node === (<ts.TemplateSpan>parent).expression;
            case ts.SyntaxKind.ComputedPropertyName:
                return node === (<ts.ComputedPropertyName>parent).expression;
            case ts.SyntaxKind.Decorator:
            case ts.SyntaxKind.JsxExpression:
            case ts.SyntaxKind.JsxSpreadAttribute:
            case ts.SyntaxKind.SpreadAssignment:
                return true;
            case ts.SyntaxKind.ExpressionWithTypeArguments:
                return (<ts.ExpressionWithTypeArguments>parent).expression === node && isExpressionWithTypeArgumentsInClassExtendsClause(parent);
            case ts.SyntaxKind.ShorthandPropertyAssignment:
                return (<ts.ShorthandPropertyAssignment>parent).objectAssignmentInitializer === node;
            default:
                return isExpressionNode(parent);
        }
    }
    export function isExternalModuleImportEqualsDeclaration(node: ts.Node) {
        return node.kind === ts.SyntaxKind.ImportEqualsDeclaration && (<ts.ImportEqualsDeclaration>node).moduleReference.kind === ts.SyntaxKind.ExternalModuleReference;
    }
    export function getExternalModuleImportEqualsDeclarationExpression(node: ts.Node) {
        ts.Debug.assert(isExternalModuleImportEqualsDeclaration(node));
        return (<ts.ExternalModuleReference>(<ts.ImportEqualsDeclaration>node).moduleReference).expression;
    }
    export function isInternalModuleImportEqualsDeclaration(node: ts.Node): node is ts.ImportEqualsDeclaration {
        return node.kind === ts.SyntaxKind.ImportEqualsDeclaration && (<ts.ImportEqualsDeclaration>node).moduleReference.kind !== ts.SyntaxKind.ExternalModuleReference;
    }
    export function isSourceFileJS(file: ts.SourceFile): boolean {
        return isInJSFile(file);
    }
    export function isSourceFileNotJS(file: ts.SourceFile): boolean {
        return !isInJSFile(file);
    }
    export function isInJSFile(node: ts.Node | undefined): boolean {
        return !!node && !!(node.flags & ts.NodeFlags.JavaScriptFile);
    }
    export function isInJsonFile(node: ts.Node | undefined): boolean {
        return !!node && !!(node.flags & ts.NodeFlags.JsonFile);
    }
    export function isInJSDoc(node: ts.Node | undefined): boolean {
        return !!node && !!(node.flags & ts.NodeFlags.JSDoc);
    }
    export function isJSDocIndexSignature(node: ts.TypeReferenceNode | ts.ExpressionWithTypeArguments) {
        return ts.isTypeReferenceNode(node) &&
            ts.isIdentifier(node.typeName) &&
            node.typeName.escapedText === "Object" &&
            node.typeArguments && node.typeArguments.length === 2 &&
            (node.typeArguments[0].kind === ts.SyntaxKind.StringKeyword || node.typeArguments[0].kind === ts.SyntaxKind.NumberKeyword);
    }
    /**
     * Returns true if the node is a CallExpression to the identifier 'require' with
     * exactly one argument (of the form 'require("name")').
     * This function does not test if the node is in a JavaScript file or not.
     */
    export function isRequireCall(callExpression: ts.Node, requireStringLiteralLikeArgument: true): callExpression is ts.RequireOrImportCall & {
        expression: ts.Identifier;
        arguments: [ts.StringLiteralLike];
    };
    export function isRequireCall(callExpression: ts.Node, requireStringLiteralLikeArgument: boolean): callExpression is ts.CallExpression;
    export function isRequireCall(callExpression: ts.Node, requireStringLiteralLikeArgument: boolean): callExpression is ts.CallExpression {
        if (callExpression.kind !== ts.SyntaxKind.CallExpression) {
            return false;
        }
        const { expression, arguments: args } = (callExpression as ts.CallExpression);
        if (expression.kind !== ts.SyntaxKind.Identifier || (expression as ts.Identifier).escapedText !== "require") {
            return false;
        }
        if (args.length !== 1) {
            return false;
        }
        const arg = args[0];
        return !requireStringLiteralLikeArgument || ts.isStringLiteralLike(arg);
    }
    export function isSingleOrDoubleQuote(charCode: number) {
        return charCode === ts.CharacterCodes.singleQuote || charCode === ts.CharacterCodes.doubleQuote;
    }
    export function isStringDoubleQuoted(str: ts.StringLiteralLike, sourceFile: ts.SourceFile): boolean {
        return getSourceTextOfNodeFromSourceFile(sourceFile, str).charCodeAt(0) === ts.CharacterCodes.doubleQuote;
    }
    export function getDeclarationOfExpando(node: ts.Node): ts.Node | undefined {
        if (!node.parent) {
            return undefined;
        }
        let name: ts.Expression | ts.BindingName | undefined;
        let decl: ts.Node | undefined;
        if (ts.isVariableDeclaration(node.parent) && node.parent.initializer === node) {
            if (!isInJSFile(node) && !isVarConst(node.parent)) {
                return undefined;
            }
            name = node.parent.name;
            decl = node.parent;
        }
        else if (ts.isBinaryExpression(node.parent)) {
            const parentNode = node.parent;
            const parentNodeOperator = node.parent.operatorToken.kind;
            if (parentNodeOperator === ts.SyntaxKind.EqualsToken && parentNode.right === node) {
                name = parentNode.left;
                decl = name;
            }
            else if (parentNodeOperator === ts.SyntaxKind.BarBarToken || parentNodeOperator === ts.SyntaxKind.QuestionQuestionToken) {
                if (ts.isVariableDeclaration(parentNode.parent) && parentNode.parent.initializer === parentNode) {
                    name = parentNode.parent.name;
                    decl = parentNode.parent;
                }
                else if (ts.isBinaryExpression(parentNode.parent) && parentNode.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken && parentNode.parent.right === parentNode) {
                    name = parentNode.parent.left;
                    decl = name;
                }
                if (!name || !isBindableStaticNameExpression(name) || !isSameEntityName(name, parentNode.left)) {
                    return undefined;
                }
            }
        }
        if (!name || !getExpandoInitializer(node, isPrototypeAccess(name))) {
            return undefined;
        }
        return decl;
    }
    export function isAssignmentDeclaration(decl: ts.Declaration) {
        return ts.isBinaryExpression(decl) || isAccessExpression(decl) || ts.isIdentifier(decl) || ts.isCallExpression(decl);
    }
    /** Get the initializer, taking into account defaulted Javascript initializers */
    export function getEffectiveInitializer(node: ts.HasExpressionInitializer) {
        if (isInJSFile(node) && node.initializer &&
            ts.isBinaryExpression(node.initializer) &&
            (node.initializer.operatorToken.kind === ts.SyntaxKind.BarBarToken || node.initializer.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) &&
            node.name && isEntityNameExpression(node.name) && isSameEntityName(node.name, node.initializer.left)) {
            return node.initializer.right;
        }
        return node.initializer;
    }
    /** Get the declaration initializer when it is container-like (See getExpandoInitializer). */
    export function getDeclaredExpandoInitializer(node: ts.HasExpressionInitializer) {
        const init = getEffectiveInitializer(node);
        return init && getExpandoInitializer(init, isPrototypeAccess(node.name));
    }
    function hasExpandoValueProperty(node: ts.ObjectLiteralExpression, isPrototypeAssignment: boolean) {
        return ts.forEach(node.properties, p => ts.isPropertyAssignment(p) &&
            ts.isIdentifier(p.name) &&
            p.name.escapedText === "value" &&
            p.initializer &&
            getExpandoInitializer(p.initializer, isPrototypeAssignment));
    }
    /**
     * Get the assignment 'initializer' -- the righthand side-- when the initializer is container-like (See getExpandoInitializer).
     * We treat the right hand side of assignments with container-like initalizers as declarations.
     */
    export function getAssignedExpandoInitializer(node: ts.Node | undefined): ts.Expression | undefined {
        if (node && node.parent && ts.isBinaryExpression(node.parent) && node.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
            const isPrototypeAssignment = isPrototypeAccess(node.parent.left);
            return getExpandoInitializer(node.parent.right, isPrototypeAssignment) ||
                getDefaultedExpandoInitializer(node.parent.left, node.parent.right, isPrototypeAssignment);
        }
        if (node && ts.isCallExpression(node) && isBindableObjectDefinePropertyCall(node)) {
            const result = hasExpandoValueProperty(node.arguments[2], node.arguments[1].text === "prototype");
            if (result) {
                return result;
            }
        }
    }
    /**
     * Recognized expando initializers are:
     * 1. (function() {})() -- IIFEs
     * 2. function() { } -- Function expressions
     * 3. class { } -- Class expressions
     * 4. {} -- Empty object literals
     * 5. { ... } -- Non-empty object literals, when used to initialize a prototype, like `C.prototype = { m() { } }`
     *
     * This function returns the provided initializer, or undefined if it is not valid.
     */
    export function getExpandoInitializer(initializer: ts.Node, isPrototypeAssignment: boolean): ts.Expression | undefined {
        if (ts.isCallExpression(initializer)) {
            const e = skipParentheses(initializer.expression);
            return e.kind === ts.SyntaxKind.FunctionExpression || e.kind === ts.SyntaxKind.ArrowFunction ? initializer : undefined;
        }
        if (initializer.kind === ts.SyntaxKind.FunctionExpression ||
            initializer.kind === ts.SyntaxKind.ClassExpression ||
            initializer.kind === ts.SyntaxKind.ArrowFunction) {
            return initializer as ts.Expression;
        }
        if (ts.isObjectLiteralExpression(initializer) && (initializer.properties.length === 0 || isPrototypeAssignment)) {
            return initializer;
        }
    }
    /**
     * A defaulted expando initializer matches the pattern
     * `Lhs = Lhs || ExpandoInitializer`
     * or `var Lhs = Lhs || ExpandoInitializer`
     *
     * The second Lhs is required to be the same as the first except that it may be prefixed with
     * 'window.', 'global.' or 'self.' The second Lhs is otherwise ignored by the binder and checker.
     */
    function getDefaultedExpandoInitializer(name: ts.Expression, initializer: ts.Expression, isPrototypeAssignment: boolean) {
        const e = ts.isBinaryExpression(initializer)
            && (initializer.operatorToken.kind === ts.SyntaxKind.BarBarToken || initializer.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)
            && getExpandoInitializer(initializer.right, isPrototypeAssignment);
        if (e && isSameEntityName(name, (initializer as ts.BinaryExpression).left)) {
            return e;
        }
    }
    export function isDefaultedExpandoInitializer(node: ts.BinaryExpression) {
        const name = ts.isVariableDeclaration(node.parent) ? node.parent.name :
            ts.isBinaryExpression(node.parent) && node.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken ? node.parent.left :
                undefined;
        return name && getExpandoInitializer(node.right, isPrototypeAccess(name)) && isEntityNameExpression(name) && isSameEntityName(name, node.left);
    }
    /** Given an expando initializer, return its declaration name, or the left-hand side of the assignment if it's part of an assignment declaration. */
    export function getNameOfExpando(node: ts.Declaration): ts.DeclarationName | undefined {
        if (ts.isBinaryExpression(node.parent)) {
            const parent = ((node.parent.operatorToken.kind === ts.SyntaxKind.BarBarToken || node.parent.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) && ts.isBinaryExpression(node.parent.parent)) ? node.parent.parent : node.parent;
            if (parent.operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isIdentifier(parent.left)) {
                return parent.left;
            }
        }
        else if (ts.isVariableDeclaration(node.parent)) {
            return node.parent.name;
        }
    }
    /**
     * Is the 'declared' name the same as the one in the initializer?
     * @return true for identical entity names, as well as ones where the initializer is prefixed with
     * 'window', 'self' or 'global'. For example:
     *
     * var my = my || {}
     * var min = window.min || {}
     * my.app = self.my.app || class { }
     */
    function isSameEntityName(name: ts.Expression, initializer: ts.Expression): boolean {
        if (isPropertyNameLiteral(name) && isPropertyNameLiteral(initializer)) {
            return getTextOfIdentifierOrLiteral(name) === getTextOfIdentifierOrLiteral(name);
        }
        if (ts.isIdentifier(name) && (isLiteralLikeAccess(initializer))) {
            return (initializer.expression.kind === ts.SyntaxKind.ThisKeyword ||
                ts.isIdentifier(initializer.expression) &&
                    (initializer.expression.escapedText === "window" ||
                        initializer.expression.escapedText === "self" ||
                        initializer.expression.escapedText === "global")) &&
                isSameEntityName(name, getNameOrArgument(initializer));
        }
        if (isLiteralLikeAccess(name) && isLiteralLikeAccess(initializer)) {
            return getElementOrPropertyAccessName(name) === getElementOrPropertyAccessName(initializer)
                && isSameEntityName(name.expression, initializer.expression);
        }
        return false;
    }
    export function getRightMostAssignedExpression(node: ts.Expression): ts.Expression {
        while (isAssignmentExpression(node, /*excludeCompoundAssignments*/ true)) {
            node = node.right;
        }
        return node;
    }
    export function isExportsIdentifier(node: ts.Node) {
        return ts.isIdentifier(node) && node.escapedText === "exports";
    }
    export function isModuleExportsAccessExpression(node: ts.Node): node is ts.LiteralLikeElementAccessExpression & {
        expression: ts.Identifier;
    } {
        return (ts.isPropertyAccessExpression(node) || isLiteralLikeElementAccess(node))
            && ts.isIdentifier(node.expression)
            && node.expression.escapedText === "module"
            && getElementOrPropertyAccessName(node) === "exports";
    }
    /// Given a BinaryExpression, returns SpecialPropertyAssignmentKind for the various kinds of property
    /// assignments we treat as special in the binder
    export function getAssignmentDeclarationKind(expr: ts.BinaryExpression | ts.CallExpression): ts.AssignmentDeclarationKind {
        const special = getAssignmentDeclarationKindWorker(expr);
        return special === ts.AssignmentDeclarationKind.Property || isInJSFile(expr) ? special : ts.AssignmentDeclarationKind.None;
    }
    export function isBindableObjectDefinePropertyCall(expr: ts.CallExpression): expr is ts.BindableObjectDefinePropertyCall {
        return ts.length(expr.arguments) === 3 &&
            ts.isPropertyAccessExpression(expr.expression) &&
            ts.isIdentifier(expr.expression.expression) &&
            ts.idText(expr.expression.expression) === "Object" &&
            ts.idText(expr.expression.name) === "defineProperty" &&
            isStringOrNumericLiteralLike(expr.arguments[1]) &&
            isBindableStaticNameExpression(expr.arguments[0], /*excludeThisKeyword*/ true);
    }
    /** x.y OR x[0] */
    export function isLiteralLikeAccess(node: ts.Node): node is ts.LiteralLikeElementAccessExpression | ts.PropertyAccessExpression {
        return ts.isPropertyAccessExpression(node) || isLiteralLikeElementAccess(node);
    }
    /** x[0] OR x['a'] OR x[Symbol.y] */
    export function isLiteralLikeElementAccess(node: ts.Node): node is ts.LiteralLikeElementAccessExpression {
        return ts.isElementAccessExpression(node) && (isStringOrNumericLiteralLike(node.argumentExpression) ||
            isWellKnownSymbolSyntactically(node.argumentExpression));
    }
    /** Any series of property and element accesses. */
    export function isBindableStaticAccessExpression(node: ts.Node, excludeThisKeyword?: boolean): node is ts.BindableStaticAccessExpression {
        return ts.isPropertyAccessExpression(node) && (!excludeThisKeyword && node.expression.kind === ts.SyntaxKind.ThisKeyword || isBindableStaticNameExpression(node.expression, /*excludeThisKeyword*/ true))
            || isBindableStaticElementAccessExpression(node, excludeThisKeyword);
    }
    /** Any series of property and element accesses, ending in a literal element access */
    export function isBindableStaticElementAccessExpression(node: ts.Node, excludeThisKeyword?: boolean): node is ts.BindableStaticElementAccessExpression {
        return isLiteralLikeElementAccess(node)
            && ((!excludeThisKeyword && node.expression.kind === ts.SyntaxKind.ThisKeyword) ||
                isEntityNameExpression(node.expression) ||
                isBindableStaticAccessExpression(node.expression, /*excludeThisKeyword*/ true));
    }
    export function isBindableStaticNameExpression(node: ts.Node, excludeThisKeyword?: boolean): node is ts.BindableStaticNameExpression {
        return isEntityNameExpression(node) || isBindableStaticAccessExpression(node, excludeThisKeyword);
    }
    export function getNameOrArgument(expr: ts.PropertyAccessExpression | ts.LiteralLikeElementAccessExpression) {
        if (ts.isPropertyAccessExpression(expr)) {
            return expr.name;
        }
        return expr.argumentExpression;
    }
    function getAssignmentDeclarationKindWorker(expr: ts.BinaryExpression | ts.CallExpression): ts.AssignmentDeclarationKind {
        if (ts.isCallExpression(expr)) {
            if (!isBindableObjectDefinePropertyCall(expr)) {
                return ts.AssignmentDeclarationKind.None;
            }
            const entityName = expr.arguments[0];
            if (isExportsIdentifier(entityName) || isModuleExportsAccessExpression(entityName)) {
                return ts.AssignmentDeclarationKind.ObjectDefinePropertyExports;
            }
            if (isBindableStaticAccessExpression(entityName) && getElementOrPropertyAccessName(entityName) === "prototype") {
                return ts.AssignmentDeclarationKind.ObjectDefinePrototypeProperty;
            }
            return ts.AssignmentDeclarationKind.ObjectDefinePropertyValue;
        }
        if (expr.operatorToken.kind !== ts.SyntaxKind.EqualsToken || !isAccessExpression(expr.left)) {
            return ts.AssignmentDeclarationKind.None;
        }
        if (isBindableStaticNameExpression(expr.left.expression, /*excludeThisKeyword*/ true) && getElementOrPropertyAccessName(expr.left) === "prototype" && ts.isObjectLiteralExpression(getInitializerOfBinaryExpression(expr))) {
            // F.prototype = { ... }
            return ts.AssignmentDeclarationKind.Prototype;
        }
        return getAssignmentDeclarationPropertyAccessKind(expr.left);
    }
    /**
     * Does not handle signed numeric names like `a[+0]` - handling those would require handling prefix unary expressions
     * throughout late binding handling as well, which is awkward (but ultimately probably doable if there is demand)
     */
    /* @internal */
    export function getElementOrPropertyAccessArgumentExpressionOrName(node: ts.AccessExpression): ts.Identifier | ts.StringLiteralLike | ts.NumericLiteral | ts.ElementAccessExpression | undefined {
        if (ts.isPropertyAccessExpression(node)) {
            return node.name;
        }
        const arg = skipParentheses(node.argumentExpression);
        if (ts.isNumericLiteral(arg) || ts.isStringLiteralLike(arg)) {
            return arg;
        }
        return node;
    }
    /* @internal */
    export function getElementOrPropertyAccessName(node: ts.LiteralLikeElementAccessExpression | ts.PropertyAccessExpression): ts.__String;
    export function getElementOrPropertyAccessName(node: ts.AccessExpression): ts.__String | undefined;
    export function getElementOrPropertyAccessName(node: ts.AccessExpression): ts.__String | undefined {
        const name = getElementOrPropertyAccessArgumentExpressionOrName(node);
        if (name) {
            if (ts.isIdentifier(name)) {
                return name.escapedText;
            }
            if (ts.isStringLiteralLike(name) || ts.isNumericLiteral(name)) {
                return ts.escapeLeadingUnderscores(name.text);
            }
        }
        if (ts.isElementAccessExpression(node) && isWellKnownSymbolSyntactically(node.argumentExpression)) {
            return getPropertyNameForKnownSymbolName(ts.idText((<ts.PropertyAccessExpression>node.argumentExpression).name));
        }
        return undefined;
    }
    export function getAssignmentDeclarationPropertyAccessKind(lhs: ts.AccessExpression): ts.AssignmentDeclarationKind {
        if (lhs.expression.kind === ts.SyntaxKind.ThisKeyword) {
            return ts.AssignmentDeclarationKind.ThisProperty;
        }
        else if (isModuleExportsAccessExpression(lhs)) {
            // module.exports = expr
            return ts.AssignmentDeclarationKind.ModuleExports;
        }
        else if (isBindableStaticNameExpression(lhs.expression, /*excludeThisKeyword*/ true)) {
            if (isPrototypeAccess(lhs.expression)) {
                // F.G....prototype.x = expr
                return ts.AssignmentDeclarationKind.PrototypeProperty;
            }
            let nextToLast = lhs;
            while (!ts.isIdentifier(nextToLast.expression)) {
                nextToLast = (nextToLast.expression as Exclude<ts.BindableStaticNameExpression, ts.Identifier>);
            }
            const id = nextToLast.expression;
            if ((id.escapedText === "exports" ||
                id.escapedText === "module" && getElementOrPropertyAccessName(nextToLast) === "exports") &&
                // ExportsProperty does not support binding with computed names
                isBindableStaticAccessExpression(lhs)) {
                // exports.name = expr OR module.exports.name = expr OR exports["name"] = expr ...
                return ts.AssignmentDeclarationKind.ExportsProperty;
            }
            if (isBindableStaticNameExpression(lhs, /*excludeThisKeyword*/ true) || (ts.isElementAccessExpression(lhs) && isDynamicName(lhs) && lhs.expression.kind !== ts.SyntaxKind.ThisKeyword)) {
                // F.G...x = expr
                return ts.AssignmentDeclarationKind.Property;
            }
        }
        return ts.AssignmentDeclarationKind.None;
    }
    export function getInitializerOfBinaryExpression(expr: ts.BinaryExpression) {
        while (ts.isBinaryExpression(expr.right)) {
            expr = expr.right;
        }
        return expr.right;
    }
    export function isPrototypePropertyAssignment(node: ts.Node): boolean {
        return ts.isBinaryExpression(node) && getAssignmentDeclarationKind(node) === ts.AssignmentDeclarationKind.PrototypeProperty;
    }
    export function isSpecialPropertyDeclaration(expr: ts.PropertyAccessExpression | ts.ElementAccessExpression): expr is ts.PropertyAccessExpression | ts.LiteralLikeElementAccessExpression {
        return isInJSFile(expr) &&
            expr.parent && expr.parent.kind === ts.SyntaxKind.ExpressionStatement &&
            (!ts.isElementAccessExpression(expr) || isLiteralLikeElementAccess(expr)) &&
            !!ts.getJSDocTypeTag(expr.parent);
    }
    export function isFunctionSymbol(symbol: ts.Symbol | undefined) {
        if (!symbol || !symbol.valueDeclaration) {
            return false;
        }
        const decl = symbol.valueDeclaration;
        return decl.kind === ts.SyntaxKind.FunctionDeclaration || ts.isVariableDeclaration(decl) && decl.initializer && ts.isFunctionLike(decl.initializer);
    }
    export function importFromModuleSpecifier(node: ts.StringLiteralLike): ts.AnyValidImportOrReExport {
        return tryGetImportFromModuleSpecifier(node) || ts.Debug.failBadSyntaxKind(node.parent);
    }
    export function tryGetImportFromModuleSpecifier(node: ts.StringLiteralLike): ts.AnyValidImportOrReExport | undefined {
        switch (node.parent.kind) {
            case ts.SyntaxKind.ImportDeclaration:
            case ts.SyntaxKind.ExportDeclaration:
                return node.parent as ts.AnyValidImportOrReExport;
            case ts.SyntaxKind.ExternalModuleReference:
                return (node.parent as ts.ExternalModuleReference).parent as ts.AnyValidImportOrReExport;
            case ts.SyntaxKind.CallExpression:
                return isImportCall(node.parent) || isRequireCall(node.parent, /*checkArg*/ false) ? node.parent as ts.RequireOrImportCall : undefined;
            case ts.SyntaxKind.LiteralType:
                ts.Debug.assert(ts.isStringLiteral(node));
                return ts.tryCast(node.parent.parent, ts.isImportTypeNode) as ts.ValidImportTypeNode | undefined;
            default:
                return undefined;
        }
    }
    export function getExternalModuleName(node: ts.AnyImportOrReExport | ts.ImportTypeNode): ts.Expression | undefined {
        switch (node.kind) {
            case ts.SyntaxKind.ImportDeclaration:
            case ts.SyntaxKind.ExportDeclaration:
                return node.moduleSpecifier;
            case ts.SyntaxKind.ImportEqualsDeclaration:
                return node.moduleReference.kind === ts.SyntaxKind.ExternalModuleReference ? node.moduleReference.expression : undefined;
            case ts.SyntaxKind.ImportType:
                return isLiteralImportTypeNode(node) ? node.argument.literal : undefined;
            default:
                return ts.Debug.assertNever(node);
        }
    }
    export function getNamespaceDeclarationNode(node: ts.ImportDeclaration | ts.ImportEqualsDeclaration | ts.ExportDeclaration): ts.ImportEqualsDeclaration | ts.NamespaceImport | undefined {
        switch (node.kind) {
            case ts.SyntaxKind.ImportDeclaration:
                return node.importClause && ts.tryCast(node.importClause.namedBindings, ts.isNamespaceImport);
            case ts.SyntaxKind.ImportEqualsDeclaration:
                return node;
            case ts.SyntaxKind.ExportDeclaration:
                return undefined;
            default:
                return ts.Debug.assertNever(node);
        }
    }
    export function isDefaultImport(node: ts.ImportDeclaration | ts.ImportEqualsDeclaration | ts.ExportDeclaration): boolean {
        return node.kind === ts.SyntaxKind.ImportDeclaration && !!node.importClause && !!node.importClause.name;
    }
    export function hasQuestionToken(node: ts.Node) {
        if (node) {
            switch (node.kind) {
                case ts.SyntaxKind.Parameter:
                case ts.SyntaxKind.MethodDeclaration:
                case ts.SyntaxKind.MethodSignature:
                case ts.SyntaxKind.ShorthandPropertyAssignment:
                case ts.SyntaxKind.PropertyAssignment:
                case ts.SyntaxKind.PropertyDeclaration:
                case ts.SyntaxKind.PropertySignature:
                    return (<ts.ParameterDeclaration | ts.MethodDeclaration | ts.PropertyDeclaration>node).questionToken !== undefined;
            }
        }
        return false;
    }
    export function isJSDocConstructSignature(node: ts.Node) {
        const param = ts.isJSDocFunctionType(node) ? ts.firstOrUndefined(node.parameters) : undefined;
        const name = ts.tryCast(param && param.name, ts.isIdentifier);
        return !!name && name.escapedText === "new";
    }
    export function isJSDocTypeAlias(node: ts.Node): node is ts.JSDocTypedefTag | ts.JSDocCallbackTag | ts.JSDocEnumTag {
        return node.kind === ts.SyntaxKind.JSDocTypedefTag || node.kind === ts.SyntaxKind.JSDocCallbackTag || node.kind === ts.SyntaxKind.JSDocEnumTag;
    }
    export function isTypeAlias(node: ts.Node): node is ts.JSDocTypedefTag | ts.JSDocCallbackTag | ts.JSDocEnumTag | ts.TypeAliasDeclaration {
        return isJSDocTypeAlias(node) || ts.isTypeAliasDeclaration(node);
    }
    function getSourceOfAssignment(node: ts.Node): ts.Node | undefined {
        return ts.isExpressionStatement(node) &&
            node.expression && ts.isBinaryExpression(node.expression) &&
            node.expression.operatorToken.kind === ts.SyntaxKind.EqualsToken
            ? node.expression.right
            : undefined;
    }
    function getSourceOfDefaultedAssignment(node: ts.Node): ts.Node | undefined {
        return ts.isExpressionStatement(node) &&
            ts.isBinaryExpression(node.expression) &&
            getAssignmentDeclarationKind(node.expression) !== ts.AssignmentDeclarationKind.None &&
            ts.isBinaryExpression(node.expression.right) &&
            (node.expression.right.operatorToken.kind === ts.SyntaxKind.BarBarToken || node.expression.right.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)
            ? node.expression.right.right
            : undefined;
    }
    export function getSingleInitializerOfVariableStatementOrPropertyDeclaration(node: ts.Node): ts.Expression | undefined {
        switch (node.kind) {
            case ts.SyntaxKind.VariableStatement:
                const v = getSingleVariableOfVariableStatement(node);
                return v && v.initializer;
            case ts.SyntaxKind.PropertyDeclaration:
                return (node as ts.PropertyDeclaration).initializer;
            case ts.SyntaxKind.PropertyAssignment:
                return (node as ts.PropertyAssignment).initializer;
        }
    }
    function getSingleVariableOfVariableStatement(node: ts.Node): ts.VariableDeclaration | undefined {
        return ts.isVariableStatement(node) ? ts.firstOrUndefined(node.declarationList.declarations) : undefined;
    }
    function getNestedModuleDeclaration(node: ts.Node): ts.Node | undefined {
        return ts.isModuleDeclaration(node) &&
            node.body &&
            node.body.kind === ts.SyntaxKind.ModuleDeclaration
            ? node.body
            : undefined;
    }
    export function getJSDocCommentsAndTags(hostNode: ts.Node): readonly (ts.JSDoc | ts.JSDocTag)[] {
        let result: (ts.JSDoc | ts.JSDocTag)[] | undefined;
        // Pull parameter comments from declaring function as well
        if (isVariableLike(hostNode) && ts.hasInitializer(hostNode) && ts.hasJSDocNodes((hostNode.initializer!))) {
            result = ts.append(result, ts.last(((hostNode.initializer as ts.HasJSDoc).jsDoc!)));
        }
        let node: ts.Node | undefined = hostNode;
        while (node && node.parent) {
            if (ts.hasJSDocNodes(node)) {
                result = ts.append(result, ts.last((node.jsDoc!)));
            }
            if (node.kind === ts.SyntaxKind.Parameter) {
                result = ts.addRange(result, ts.getJSDocParameterTags((node as ts.ParameterDeclaration)));
                break;
            }
            if (node.kind === ts.SyntaxKind.TypeParameter) {
                result = ts.addRange(result, ts.getJSDocTypeParameterTags((node as ts.TypeParameterDeclaration)));
                break;
            }
            node = getNextJSDocCommentLocation(node);
        }
        return result || ts.emptyArray;
    }
    function getNextJSDocCommentLocation(node: ts.Node) {
        const parent = node.parent;
        if (parent.kind === ts.SyntaxKind.PropertyAssignment ||
            parent.kind === ts.SyntaxKind.ExportAssignment ||
            parent.kind === ts.SyntaxKind.PropertyDeclaration ||
            parent.kind === ts.SyntaxKind.ExpressionStatement && node.kind === ts.SyntaxKind.PropertyAccessExpression ||
            getNestedModuleDeclaration(parent) ||
            ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
            return parent;
        }
        // Try to recognize this pattern when node is initializer of variable declaration and JSDoc comments are on containing variable statement.
        // /**
        //   * @param {number} name
        //   * @returns {number}
        //   */
        // var x = function(name) { return name.length; }
        else if (parent.parent &&
            (getSingleVariableOfVariableStatement(parent.parent) === node ||
                ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.EqualsToken)) {
            return parent.parent;
        }
        else if (parent.parent && parent.parent.parent &&
            (getSingleVariableOfVariableStatement(parent.parent.parent) ||
                getSingleInitializerOfVariableStatementOrPropertyDeclaration(parent.parent.parent) === node ||
                getSourceOfDefaultedAssignment(parent.parent.parent))) {
            return parent.parent.parent;
        }
    }
    /** Does the opposite of `getJSDocParameterTags`: given a JSDoc parameter, finds the parameter corresponding to it. */
    export function getParameterSymbolFromJSDoc(node: ts.JSDocParameterTag): ts.Symbol | undefined {
        if (node.symbol) {
            return node.symbol;
        }
        if (!ts.isIdentifier(node.name)) {
            return undefined;
        }
        const name = node.name.escapedText;
        const decl = getHostSignatureFromJSDoc(node);
        if (!decl) {
            return undefined;
        }
        const parameter = ts.find(decl.parameters, p => p.name.kind === ts.SyntaxKind.Identifier && p.name.escapedText === name);
        return parameter && parameter.symbol;
    }
    export function getHostSignatureFromJSDoc(node: ts.Node): ts.SignatureDeclaration | undefined {
        return getHostSignatureFromJSDocHost(getJSDocHost(node));
    }
    export function getHostSignatureFromJSDocHost(host: ts.HasJSDoc): ts.SignatureDeclaration | undefined {
        const decl = getSourceOfDefaultedAssignment(host) ||
            getSourceOfAssignment(host) ||
            getSingleInitializerOfVariableStatementOrPropertyDeclaration(host) ||
            getSingleVariableOfVariableStatement(host) ||
            getNestedModuleDeclaration(host) ||
            host;
        return decl && ts.isFunctionLike(decl) ? decl : undefined;
    }
    export function getJSDocHost(node: ts.Node): ts.HasJSDoc {
        return ts.Debug.assertDefined(findAncestor(node.parent, ts.isJSDoc)).parent;
    }
    export function getTypeParameterFromJsDoc(node: ts.TypeParameterDeclaration & {
        parent: ts.JSDocTemplateTag;
    }): ts.TypeParameterDeclaration | undefined {
        const name = node.name.escapedText;
        const { typeParameters } = (node.parent.parent.parent as ts.SignatureDeclaration | ts.InterfaceDeclaration | ts.ClassDeclaration);
        return typeParameters && ts.find(typeParameters, p => p.name.escapedText === name);
    }
    export function hasRestParameter(s: ts.SignatureDeclaration | ts.JSDocSignature): boolean {
        const last = ts.lastOrUndefined<ts.ParameterDeclaration | ts.JSDocParameterTag>(s.parameters);
        return !!last && isRestParameter(last);
    }
    export function isRestParameter(node: ts.ParameterDeclaration | ts.JSDocParameterTag): boolean {
        const type = ts.isJSDocParameterTag(node) ? (node.typeExpression && node.typeExpression.type) : node.type;
        return (node as ts.ParameterDeclaration).dotDotDotToken !== undefined || !!type && type.kind === ts.SyntaxKind.JSDocVariadicType;
    }
    export function hasTypeArguments(node: ts.Node): node is ts.HasTypeArguments {
        return !!(node as ts.HasTypeArguments).typeArguments;
    }
    export const enum AssignmentKind {
        None,
        Definite,
        Compound
    }
    export function getAssignmentTargetKind(node: ts.Node): AssignmentKind {
        let parent = node.parent;
        while (true) {
            switch (parent.kind) {
                case ts.SyntaxKind.BinaryExpression:
                    const binaryOperator = (<ts.BinaryExpression>parent).operatorToken.kind;
                    return isAssignmentOperator(binaryOperator) && (<ts.BinaryExpression>parent).left === node ?
                        binaryOperator === ts.SyntaxKind.EqualsToken ? AssignmentKind.Definite : AssignmentKind.Compound :
                        AssignmentKind.None;
                case ts.SyntaxKind.PrefixUnaryExpression:
                case ts.SyntaxKind.PostfixUnaryExpression:
                    const unaryOperator = (<ts.PrefixUnaryExpression | ts.PostfixUnaryExpression>parent).operator;
                    return unaryOperator === ts.SyntaxKind.PlusPlusToken || unaryOperator === ts.SyntaxKind.MinusMinusToken ? AssignmentKind.Compound : AssignmentKind.None;
                case ts.SyntaxKind.ForInStatement:
                case ts.SyntaxKind.ForOfStatement:
                    return (<ts.ForInOrOfStatement>parent).initializer === node ? AssignmentKind.Definite : AssignmentKind.None;
                case ts.SyntaxKind.ParenthesizedExpression:
                case ts.SyntaxKind.ArrayLiteralExpression:
                case ts.SyntaxKind.SpreadElement:
                case ts.SyntaxKind.NonNullExpression:
                    node = parent;
                    break;
                case ts.SyntaxKind.ShorthandPropertyAssignment:
                    if ((parent as ts.ShorthandPropertyAssignment).name !== node) {
                        return AssignmentKind.None;
                    }
                    node = parent.parent;
                    break;
                case ts.SyntaxKind.PropertyAssignment:
                    if ((parent as ts.ShorthandPropertyAssignment).name === node) {
                        return AssignmentKind.None;
                    }
                    node = parent.parent;
                    break;
                default:
                    return AssignmentKind.None;
            }
            parent = node.parent;
        }
    }
    // A node is an assignment target if it is on the left hand side of an '=' token, if it is parented by a property
    // assignment in an object literal that is an assignment target, or if it is parented by an array literal that is
    // an assignment target. Examples include 'a = xxx', '{ p: a } = xxx', '[{ a }] = xxx'.
    // (Note that `p` is not a target in the above examples, only `a`.)
    export function isAssignmentTarget(node: ts.Node): boolean {
        return getAssignmentTargetKind(node) !== AssignmentKind.None;
    }
    export type NodeWithPossibleHoistedDeclaration = ts.Block | ts.VariableStatement | ts.WithStatement | ts.IfStatement | ts.SwitchStatement | ts.CaseBlock | ts.CaseClause | ts.DefaultClause | ts.LabeledStatement | ts.ForStatement | ts.ForInStatement | ts.ForOfStatement | ts.DoStatement | ts.WhileStatement | ts.TryStatement | ts.CatchClause;
    /**
     * Indicates whether a node could contain a `var` VariableDeclarationList that contributes to
     * the same `var` declaration scope as the node's parent.
     */
    export function isNodeWithPossibleHoistedDeclaration(node: ts.Node): node is NodeWithPossibleHoistedDeclaration {
        switch (node.kind) {
            case ts.SyntaxKind.Block:
            case ts.SyntaxKind.VariableStatement:
            case ts.SyntaxKind.WithStatement:
            case ts.SyntaxKind.IfStatement:
            case ts.SyntaxKind.SwitchStatement:
            case ts.SyntaxKind.CaseBlock:
            case ts.SyntaxKind.CaseClause:
            case ts.SyntaxKind.DefaultClause:
            case ts.SyntaxKind.LabeledStatement:
            case ts.SyntaxKind.ForStatement:
            case ts.SyntaxKind.ForInStatement:
            case ts.SyntaxKind.ForOfStatement:
            case ts.SyntaxKind.DoStatement:
            case ts.SyntaxKind.WhileStatement:
            case ts.SyntaxKind.TryStatement:
            case ts.SyntaxKind.CatchClause:
                return true;
        }
        return false;
    }
    export type ValueSignatureDeclaration = ts.FunctionDeclaration | ts.MethodDeclaration | ts.ConstructorDeclaration | ts.AccessorDeclaration | ts.FunctionExpression | ts.ArrowFunction;
    export function isValueSignatureDeclaration(node: ts.Node): node is ValueSignatureDeclaration {
        return ts.isFunctionExpression(node) || ts.isArrowFunction(node) || ts.isMethodOrAccessor(node) || ts.isFunctionDeclaration(node) || ts.isConstructorDeclaration(node);
    }
    function walkUp(node: ts.Node, kind: ts.SyntaxKind) {
        while (node && node.kind === kind) {
            node = node.parent;
        }
        return node;
    }
    export function walkUpParenthesizedTypes(node: ts.Node) {
        return walkUp(node, ts.SyntaxKind.ParenthesizedType);
    }
    export function walkUpParenthesizedExpressions(node: ts.Node) {
        return walkUp(node, ts.SyntaxKind.ParenthesizedExpression);
    }
    export function skipParentheses(node: ts.Expression): ts.Expression;
    export function skipParentheses(node: ts.Node): ts.Node;
    export function skipParentheses(node: ts.Node): ts.Node {
        while (node.kind === ts.SyntaxKind.ParenthesizedExpression) {
            node = (node as ts.ParenthesizedExpression).expression;
        }
        return node;
    }
    function skipParenthesesUp(node: ts.Node): ts.Node {
        while (node.kind === ts.SyntaxKind.ParenthesizedExpression) {
            node = node.parent;
        }
        return node;
    }
    // a node is delete target iff. it is PropertyAccessExpression/ElementAccessExpression with parentheses skipped
    export function isDeleteTarget(node: ts.Node): boolean {
        if (node.kind !== ts.SyntaxKind.PropertyAccessExpression && node.kind !== ts.SyntaxKind.ElementAccessExpression) {
            return false;
        }
        node = walkUpParenthesizedExpressions(node.parent);
        return node && node.kind === ts.SyntaxKind.DeleteExpression;
    }
    export function isNodeDescendantOf(node: ts.Node, ancestor: ts.Node | undefined): boolean {
        while (node) {
            if (node === ancestor)
                return true;
            node = node.parent;
        }
        return false;
    }
    // True if `name` is the name of a declaration node
    export function isDeclarationName(name: ts.Node): boolean {
        return !ts.isSourceFile(name) && !ts.isBindingPattern(name) && ts.isDeclaration(name.parent) && name.parent.name === name;
    }
    // See GH#16030
    export function getDeclarationFromName(name: ts.Node): ts.Declaration | undefined {
        const parent = name.parent;
        switch (name.kind) {
            case ts.SyntaxKind.StringLiteral:
            case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
            case ts.SyntaxKind.NumericLiteral:
                if (ts.isComputedPropertyName(parent))
                    return parent.parent;
            // falls through
            case ts.SyntaxKind.Identifier:
                if (ts.isDeclaration(parent)) {
                    return parent.name === name ? parent : undefined;
                }
                else if (ts.isQualifiedName(parent)) {
                    const tag = parent.parent;
                    return ts.isJSDocParameterTag(tag) && tag.name === parent ? tag : undefined;
                }
                else {
                    const binExp = parent.parent;
                    return ts.isBinaryExpression(binExp) &&
                        getAssignmentDeclarationKind(binExp) !== ts.AssignmentDeclarationKind.None &&
                        (binExp.left.symbol || binExp.symbol) &&
                        ts.getNameOfDeclaration(binExp) === name
                        ? binExp
                        : undefined;
                }
            default:
                return undefined;
        }
    }
    export function isLiteralComputedPropertyDeclarationName(node: ts.Node) {
        return isStringOrNumericLiteralLike(node) &&
            node.parent.kind === ts.SyntaxKind.ComputedPropertyName &&
            ts.isDeclaration(node.parent.parent);
    }
    // Return true if the given identifier is classified as an IdentifierName
    export function isIdentifierName(node: ts.Identifier): boolean {
        let parent = node.parent;
        switch (parent.kind) {
            case ts.SyntaxKind.PropertyDeclaration:
            case ts.SyntaxKind.PropertySignature:
            case ts.SyntaxKind.MethodDeclaration:
            case ts.SyntaxKind.MethodSignature:
            case ts.SyntaxKind.GetAccessor:
            case ts.SyntaxKind.SetAccessor:
            case ts.SyntaxKind.EnumMember:
            case ts.SyntaxKind.PropertyAssignment:
            case ts.SyntaxKind.PropertyAccessExpression:
                // Name in member declaration or property name in property access
                return (<ts.NamedDeclaration | ts.PropertyAccessExpression>parent).name === node;
            case ts.SyntaxKind.QualifiedName:
                // Name on right hand side of dot in a type query or type reference
                if ((<ts.QualifiedName>parent).right === node) {
                    while (parent.kind === ts.SyntaxKind.QualifiedName) {
                        parent = parent.parent;
                    }
                    return parent.kind === ts.SyntaxKind.TypeQuery || parent.kind === ts.SyntaxKind.TypeReference;
                }
                return false;
            case ts.SyntaxKind.BindingElement:
            case ts.SyntaxKind.ImportSpecifier:
                // Property name in binding element or import specifier
                return (<ts.BindingElement | ts.ImportSpecifier>parent).propertyName === node;
            case ts.SyntaxKind.ExportSpecifier:
            case ts.SyntaxKind.JsxAttribute:
                // Any name in an export specifier or JSX Attribute
                return true;
        }
        return false;
    }
    // An alias symbol is created by one of the following declarations:
    // import <symbol> = ...
    // import <symbol> from ...
    // import * as <symbol> from ...
    // import { x as <symbol> } from ...
    // export { x as <symbol> } from ...
    // export = <EntityNameExpression>
    // export default <EntityNameExpression>
    // module.exports = <EntityNameExpression>
    // {<Identifier>}
    // {name: <EntityNameExpression>}
    export function isAliasSymbolDeclaration(node: ts.Node): boolean {
        return node.kind === ts.SyntaxKind.ImportEqualsDeclaration ||
            node.kind === ts.SyntaxKind.NamespaceExportDeclaration ||
            node.kind === ts.SyntaxKind.ImportClause && !!(<ts.ImportClause>node).name ||
            node.kind === ts.SyntaxKind.NamespaceImport ||
            node.kind === ts.SyntaxKind.ImportSpecifier ||
            node.kind === ts.SyntaxKind.ExportSpecifier ||
            node.kind === ts.SyntaxKind.ExportAssignment && exportAssignmentIsAlias((<ts.ExportAssignment>node)) ||
            ts.isBinaryExpression(node) && getAssignmentDeclarationKind(node) === ts.AssignmentDeclarationKind.ModuleExports && exportAssignmentIsAlias(node) ||
            ts.isPropertyAccessExpression(node) && ts.isBinaryExpression(node.parent) && node.parent.left === node && node.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken && isAliasableExpression(node.parent.right) ||
            node.kind === ts.SyntaxKind.ShorthandPropertyAssignment ||
            node.kind === ts.SyntaxKind.PropertyAssignment && isAliasableExpression((node as ts.PropertyAssignment).initializer);
    }
    function isAliasableExpression(e: ts.Expression) {
        return isEntityNameExpression(e) || ts.isClassExpression(e);
    }
    export function exportAssignmentIsAlias(node: ts.ExportAssignment | ts.BinaryExpression): boolean {
        const e = getExportAssignmentExpression(node);
        return isAliasableExpression(e);
    }
    export function getExportAssignmentExpression(node: ts.ExportAssignment | ts.BinaryExpression): ts.Expression {
        return ts.isExportAssignment(node) ? node.expression : node.right;
    }
    export function getPropertyAssignmentAliasLikeExpression(node: ts.PropertyAssignment | ts.ShorthandPropertyAssignment | ts.PropertyAccessExpression): ts.Expression {
        return node.kind === ts.SyntaxKind.ShorthandPropertyAssignment ? node.name : node.kind === ts.SyntaxKind.PropertyAssignment ? node.initializer :
            (node.parent as ts.BinaryExpression).right;
    }
    export function getEffectiveBaseTypeNode(node: ts.ClassLikeDeclaration | ts.InterfaceDeclaration) {
        const baseType = getClassExtendsHeritageElement(node);
        if (baseType && isInJSFile(node)) {
            // Prefer an @augments tag because it may have type parameters.
            const tag = ts.getJSDocAugmentsTag(node);
            if (tag) {
                return tag.class;
            }
        }
        return baseType;
    }
    export function getClassExtendsHeritageElement(node: ts.ClassLikeDeclaration | ts.InterfaceDeclaration) {
        const heritageClause = getHeritageClause(node.heritageClauses, ts.SyntaxKind.ExtendsKeyword);
        return heritageClause && heritageClause.types.length > 0 ? heritageClause.types[0] : undefined;
    }
    export function getClassImplementsHeritageClauseElements(node: ts.ClassLikeDeclaration) {
        const heritageClause = getHeritageClause(node.heritageClauses, ts.SyntaxKind.ImplementsKeyword);
        return heritageClause ? heritageClause.types : undefined;
    }
    /** Returns the node in an `extends` or `implements` clause of a class or interface. */
    export function getAllSuperTypeNodes(node: ts.Node): readonly ts.TypeNode[] {
        return ts.isInterfaceDeclaration(node) ? getInterfaceBaseTypeNodes(node) || ts.emptyArray :
            ts.isClassLike(node) ? ts.concatenate(ts.singleElementArray(getEffectiveBaseTypeNode(node)), getClassImplementsHeritageClauseElements(node)) || ts.emptyArray : ts.emptyArray;
    }
    export function getInterfaceBaseTypeNodes(node: ts.InterfaceDeclaration) {
        const heritageClause = getHeritageClause(node.heritageClauses, ts.SyntaxKind.ExtendsKeyword);
        return heritageClause ? heritageClause.types : undefined;
    }
    export function getHeritageClause(clauses: ts.NodeArray<ts.HeritageClause> | undefined, kind: ts.SyntaxKind) {
        if (clauses) {
            for (const clause of clauses) {
                if (clause.token === kind) {
                    return clause;
                }
            }
        }
        return undefined;
    }
    export function getAncestor(node: ts.Node | undefined, kind: ts.SyntaxKind): ts.Node | undefined {
        while (node) {
            if (node.kind === kind) {
                return node;
            }
            node = node.parent;
        }
        return undefined;
    }
    export function isKeyword(token: ts.SyntaxKind): boolean {
        return ts.SyntaxKind.FirstKeyword <= token && token <= ts.SyntaxKind.LastKeyword;
    }
    export function isContextualKeyword(token: ts.SyntaxKind): boolean {
        return ts.SyntaxKind.FirstContextualKeyword <= token && token <= ts.SyntaxKind.LastContextualKeyword;
    }
    export function isNonContextualKeyword(token: ts.SyntaxKind): boolean {
        return isKeyword(token) && !isContextualKeyword(token);
    }
    export function isFutureReservedKeyword(token: ts.SyntaxKind): boolean {
        return ts.SyntaxKind.FirstFutureReservedWord <= token && token <= ts.SyntaxKind.LastFutureReservedWord;
    }
    export function isStringANonContextualKeyword(name: string) {
        const token = ts.stringToToken(name);
        return token !== undefined && isNonContextualKeyword(token);
    }
    export function isStringAKeyword(name: string) {
        const token = ts.stringToToken(name);
        return token !== undefined && isKeyword(token);
    }
    export function isIdentifierANonContextualKeyword({ originalKeywordKind }: ts.Identifier): boolean {
        return !!originalKeywordKind && !isContextualKeyword(originalKeywordKind);
    }
    export type TriviaKind = ts.SyntaxKind.SingleLineCommentTrivia | ts.SyntaxKind.MultiLineCommentTrivia | ts.SyntaxKind.NewLineTrivia | ts.SyntaxKind.WhitespaceTrivia | ts.SyntaxKind.ShebangTrivia | ts.SyntaxKind.ConflictMarkerTrivia;
    export function isTrivia(token: ts.SyntaxKind): token is TriviaKind {
        return ts.SyntaxKind.FirstTriviaToken <= token && token <= ts.SyntaxKind.LastTriviaToken;
    }
    export const enum FunctionFlags {
        Normal = 0,
        Generator = 1 << 0,
        Async = 1 << 1,
        Invalid = 1 << 2,
        AsyncGenerator = Async | Generator
    }
    export function getFunctionFlags(node: ts.SignatureDeclaration | undefined) {
        if (!node) {
            return FunctionFlags.Invalid;
        }
        let flags = FunctionFlags.Normal;
        switch (node.kind) {
            case ts.SyntaxKind.FunctionDeclaration:
            case ts.SyntaxKind.FunctionExpression:
            case ts.SyntaxKind.MethodDeclaration:
                if (node.asteriskToken) {
                    flags |= FunctionFlags.Generator;
                }
            // falls through
            case ts.SyntaxKind.ArrowFunction:
                if (hasModifier(node, ts.ModifierFlags.Async)) {
                    flags |= FunctionFlags.Async;
                }
                break;
        }
        if (!(node as ts.FunctionLikeDeclaration).body) {
            flags |= FunctionFlags.Invalid;
        }
        return flags;
    }
    export function isAsyncFunction(node: ts.Node): boolean {
        switch (node.kind) {
            case ts.SyntaxKind.FunctionDeclaration:
            case ts.SyntaxKind.FunctionExpression:
            case ts.SyntaxKind.ArrowFunction:
            case ts.SyntaxKind.MethodDeclaration:
                return (<ts.FunctionLikeDeclaration>node).body !== undefined
                    && (<ts.FunctionLikeDeclaration>node).asteriskToken === undefined
                    && hasModifier(node, ts.ModifierFlags.Async);
        }
        return false;
    }
    export function isStringOrNumericLiteralLike(node: ts.Node): node is ts.StringLiteralLike | ts.NumericLiteral {
        return ts.isStringLiteralLike(node) || ts.isNumericLiteral(node);
    }
    export function isSignedNumericLiteral(node: ts.Node): node is ts.PrefixUnaryExpression & {
        operand: ts.NumericLiteral;
    } {
        return ts.isPrefixUnaryExpression(node) && (node.operator === ts.SyntaxKind.PlusToken || node.operator === ts.SyntaxKind.MinusToken) && ts.isNumericLiteral(node.operand);
    }
    /**
     * A declaration has a dynamic name if all of the following are true:
     *   1. The declaration has a computed property name.
     *   2. The computed name is *not* expressed as a StringLiteral.
     *   3. The computed name is *not* expressed as a NumericLiteral.
     *   4. The computed name is *not* expressed as a PlusToken or MinusToken
     *      immediately followed by a NumericLiteral.
     *   5. The computed name is *not* expressed as `Symbol.<name>`, where `<name>`
     *      is a property of the Symbol constructor that denotes a built-in
     *      Symbol.
     */
    export function hasDynamicName(declaration: ts.Declaration): declaration is ts.DynamicNamedDeclaration | ts.DynamicNamedBinaryExpression {
        const name = ts.getNameOfDeclaration(declaration);
        return !!name && isDynamicName(name);
    }
    export function isDynamicName(name: ts.DeclarationName): boolean {
        if (!(name.kind === ts.SyntaxKind.ComputedPropertyName || name.kind === ts.SyntaxKind.ElementAccessExpression)) {
            return false;
        }
        const expr = ts.isElementAccessExpression(name) ? name.argumentExpression : name.expression;
        return !isStringOrNumericLiteralLike(expr) &&
            !isSignedNumericLiteral(expr) &&
            !isWellKnownSymbolSyntactically(expr);
    }
    /**
     * Checks if the expression is of the form:
     *    Symbol.name
     * where Symbol is literally the word "Symbol", and name is any identifierName
     */
    export function isWellKnownSymbolSyntactically(node: ts.Node): node is ts.WellKnownSymbolExpression {
        return ts.isPropertyAccessExpression(node) && isESSymbolIdentifier(node.expression);
    }
    export function getPropertyNameForPropertyNameNode(name: ts.PropertyName): ts.__String | undefined {
        switch (name.kind) {
            case ts.SyntaxKind.Identifier:
                return name.escapedText;
            case ts.SyntaxKind.StringLiteral:
            case ts.SyntaxKind.NumericLiteral:
                return ts.escapeLeadingUnderscores(name.text);
            case ts.SyntaxKind.ComputedPropertyName:
                const nameExpression = name.expression;
                if (isWellKnownSymbolSyntactically(nameExpression)) {
                    return getPropertyNameForKnownSymbolName(ts.idText((<ts.PropertyAccessExpression>nameExpression).name));
                }
                else if (isStringOrNumericLiteralLike(nameExpression)) {
                    return ts.escapeLeadingUnderscores(nameExpression.text);
                }
                return undefined;
            default:
                return ts.Debug.assertNever(name);
        }
    }
    export type PropertyNameLiteral = ts.Identifier | ts.StringLiteralLike | ts.NumericLiteral;
    export function isPropertyNameLiteral(node: ts.Node): node is PropertyNameLiteral {
        switch (node.kind) {
            case ts.SyntaxKind.Identifier:
            case ts.SyntaxKind.StringLiteral:
            case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
            case ts.SyntaxKind.NumericLiteral:
                return true;
            default:
                return false;
        }
    }
    export function getTextOfIdentifierOrLiteral(node: PropertyNameLiteral): string {
        return node.kind === ts.SyntaxKind.Identifier ? ts.idText(node) : node.text;
    }
    export function getEscapedTextOfIdentifierOrLiteral(node: PropertyNameLiteral): ts.__String {
        return node.kind === ts.SyntaxKind.Identifier ? node.escapedText : ts.escapeLeadingUnderscores(node.text);
    }
    export function getPropertyNameForKnownSymbolName(symbolName: string): ts.__String {
        return "__@" + symbolName as ts.__String;
    }
    export function isKnownSymbol(symbol: ts.Symbol): boolean {
        return ts.startsWith((symbol.escapedName as string), "__@");
    }
    /**
     * Includes the word "Symbol" with unicode escapes
     */
    export function isESSymbolIdentifier(node: ts.Node): boolean {
        return node.kind === ts.SyntaxKind.Identifier && (<ts.Identifier>node).escapedText === "Symbol";
    }
    export function isPushOrUnshiftIdentifier(node: ts.Identifier) {
        return node.escapedText === "push" || node.escapedText === "unshift";
    }
    export function isParameterDeclaration(node: ts.VariableLikeDeclaration) {
        const root = getRootDeclaration(node);
        return root.kind === ts.SyntaxKind.Parameter;
    }
    export function getRootDeclaration(node: ts.Node): ts.Node {
        while (node.kind === ts.SyntaxKind.BindingElement) {
            node = node.parent.parent;
        }
        return node;
    }
    export function nodeStartsNewLexicalEnvironment(node: ts.Node): boolean {
        const kind = node.kind;
        return kind === ts.SyntaxKind.Constructor
            || kind === ts.SyntaxKind.FunctionExpression
            || kind === ts.SyntaxKind.FunctionDeclaration
            || kind === ts.SyntaxKind.ArrowFunction
            || kind === ts.SyntaxKind.MethodDeclaration
            || kind === ts.SyntaxKind.GetAccessor
            || kind === ts.SyntaxKind.SetAccessor
            || kind === ts.SyntaxKind.ModuleDeclaration
            || kind === ts.SyntaxKind.SourceFile;
    }
    export function nodeIsSynthesized(range: ts.TextRange): boolean {
        return positionIsSynthesized(range.pos)
            || positionIsSynthesized(range.end);
    }
    export function getOriginalSourceFile(sourceFile: ts.SourceFile) {
        return ts.getParseTreeNode(sourceFile, ts.isSourceFile) || sourceFile;
    }
    export const enum Associativity {
        Left,
        Right
    }
    export function getExpressionAssociativity(expression: ts.Expression) {
        const operator = getOperator(expression);
        const hasArguments = expression.kind === ts.SyntaxKind.NewExpression && (<ts.NewExpression>expression).arguments !== undefined;
        return getOperatorAssociativity(expression.kind, operator, hasArguments);
    }
    export function getOperatorAssociativity(kind: ts.SyntaxKind, operator: ts.SyntaxKind, hasArguments?: boolean) {
        switch (kind) {
            case ts.SyntaxKind.NewExpression:
                return hasArguments ? Associativity.Left : Associativity.Right;
            case ts.SyntaxKind.PrefixUnaryExpression:
            case ts.SyntaxKind.TypeOfExpression:
            case ts.SyntaxKind.VoidExpression:
            case ts.SyntaxKind.DeleteExpression:
            case ts.SyntaxKind.AwaitExpression:
            case ts.SyntaxKind.ConditionalExpression:
            case ts.SyntaxKind.YieldExpression:
                return Associativity.Right;
            case ts.SyntaxKind.BinaryExpression:
                switch (operator) {
                    case ts.SyntaxKind.AsteriskAsteriskToken:
                    case ts.SyntaxKind.EqualsToken:
                    case ts.SyntaxKind.PlusEqualsToken:
                    case ts.SyntaxKind.MinusEqualsToken:
                    case ts.SyntaxKind.AsteriskAsteriskEqualsToken:
                    case ts.SyntaxKind.AsteriskEqualsToken:
                    case ts.SyntaxKind.SlashEqualsToken:
                    case ts.SyntaxKind.PercentEqualsToken:
                    case ts.SyntaxKind.LessThanLessThanEqualsToken:
                    case ts.SyntaxKind.GreaterThanGreaterThanEqualsToken:
                    case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken:
                    case ts.SyntaxKind.AmpersandEqualsToken:
                    case ts.SyntaxKind.CaretEqualsToken:
                    case ts.SyntaxKind.BarEqualsToken:
                        return Associativity.Right;
                }
        }
        return Associativity.Left;
    }
    export function getExpressionPrecedence(expression: ts.Expression) {
        const operator = getOperator(expression);
        const hasArguments = expression.kind === ts.SyntaxKind.NewExpression && (<ts.NewExpression>expression).arguments !== undefined;
        return getOperatorPrecedence(expression.kind, operator, hasArguments);
    }
    export function getOperator(expression: ts.Expression): ts.SyntaxKind {
        if (expression.kind === ts.SyntaxKind.BinaryExpression) {
            return (<ts.BinaryExpression>expression).operatorToken.kind;
        }
        else if (expression.kind === ts.SyntaxKind.PrefixUnaryExpression || expression.kind === ts.SyntaxKind.PostfixUnaryExpression) {
            return (<ts.PrefixUnaryExpression | ts.PostfixUnaryExpression>expression).operator;
        }
        else {
            return expression.kind;
        }
    }
    export function getOperatorPrecedence(nodeKind: ts.SyntaxKind, operatorKind: ts.SyntaxKind, hasArguments?: boolean) {
        switch (nodeKind) {
            case ts.SyntaxKind.CommaListExpression:
                return 0;
            case ts.SyntaxKind.SpreadElement:
                return 1;
            case ts.SyntaxKind.YieldExpression:
                return 2;
            case ts.SyntaxKind.ConditionalExpression:
                return 4;
            case ts.SyntaxKind.BinaryExpression:
                switch (operatorKind) {
                    case ts.SyntaxKind.CommaToken:
                        return 0;
                    case ts.SyntaxKind.EqualsToken:
                    case ts.SyntaxKind.PlusEqualsToken:
                    case ts.SyntaxKind.MinusEqualsToken:
                    case ts.SyntaxKind.AsteriskAsteriskEqualsToken:
                    case ts.SyntaxKind.AsteriskEqualsToken:
                    case ts.SyntaxKind.SlashEqualsToken:
                    case ts.SyntaxKind.PercentEqualsToken:
                    case ts.SyntaxKind.LessThanLessThanEqualsToken:
                    case ts.SyntaxKind.GreaterThanGreaterThanEqualsToken:
                    case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken:
                    case ts.SyntaxKind.AmpersandEqualsToken:
                    case ts.SyntaxKind.CaretEqualsToken:
                    case ts.SyntaxKind.BarEqualsToken:
                        return 3;
                    default:
                        return getBinaryOperatorPrecedence(operatorKind);
                }
            case ts.SyntaxKind.PrefixUnaryExpression:
            case ts.SyntaxKind.TypeOfExpression:
            case ts.SyntaxKind.VoidExpression:
            case ts.SyntaxKind.DeleteExpression:
            case ts.SyntaxKind.AwaitExpression:
                return 16;
            case ts.SyntaxKind.PostfixUnaryExpression:
                return 17;
            case ts.SyntaxKind.CallExpression:
                return 18;
            case ts.SyntaxKind.NewExpression:
                return hasArguments ? 19 : 18;
            case ts.SyntaxKind.TaggedTemplateExpression:
            case ts.SyntaxKind.PropertyAccessExpression:
            case ts.SyntaxKind.ElementAccessExpression:
                return 19;
            case ts.SyntaxKind.ThisKeyword:
            case ts.SyntaxKind.SuperKeyword:
            case ts.SyntaxKind.Identifier:
            case ts.SyntaxKind.NullKeyword:
            case ts.SyntaxKind.TrueKeyword:
            case ts.SyntaxKind.FalseKeyword:
            case ts.SyntaxKind.NumericLiteral:
            case ts.SyntaxKind.BigIntLiteral:
            case ts.SyntaxKind.StringLiteral:
            case ts.SyntaxKind.ArrayLiteralExpression:
            case ts.SyntaxKind.ObjectLiteralExpression:
            case ts.SyntaxKind.FunctionExpression:
            case ts.SyntaxKind.ArrowFunction:
            case ts.SyntaxKind.ClassExpression:
            case ts.SyntaxKind.JsxElement:
            case ts.SyntaxKind.JsxSelfClosingElement:
            case ts.SyntaxKind.JsxFragment:
            case ts.SyntaxKind.RegularExpressionLiteral:
            case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
            case ts.SyntaxKind.TemplateExpression:
            case ts.SyntaxKind.ParenthesizedExpression:
            case ts.SyntaxKind.OmittedExpression:
                return 20;
            default:
                return -1;
        }
    }
    export function getBinaryOperatorPrecedence(kind: ts.SyntaxKind): number {
        switch (kind) {
            case ts.SyntaxKind.QuestionQuestionToken:
                return 4;
            case ts.SyntaxKind.BarBarToken:
                return 5;
            case ts.SyntaxKind.AmpersandAmpersandToken:
                return 6;
            case ts.SyntaxKind.BarToken:
                return 7;
            case ts.SyntaxKind.CaretToken:
                return 8;
            case ts.SyntaxKind.AmpersandToken:
                return 9;
            case ts.SyntaxKind.EqualsEqualsToken:
            case ts.SyntaxKind.ExclamationEqualsToken:
            case ts.SyntaxKind.EqualsEqualsEqualsToken:
            case ts.SyntaxKind.ExclamationEqualsEqualsToken:
                return 10;
            case ts.SyntaxKind.LessThanToken:
            case ts.SyntaxKind.GreaterThanToken:
            case ts.SyntaxKind.LessThanEqualsToken:
            case ts.SyntaxKind.GreaterThanEqualsToken:
            case ts.SyntaxKind.InstanceOfKeyword:
            case ts.SyntaxKind.InKeyword:
            case ts.SyntaxKind.AsKeyword:
                return 11;
            case ts.SyntaxKind.LessThanLessThanToken:
            case ts.SyntaxKind.GreaterThanGreaterThanToken:
            case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken:
                return 12;
            case ts.SyntaxKind.PlusToken:
            case ts.SyntaxKind.MinusToken:
                return 13;
            case ts.SyntaxKind.AsteriskToken:
            case ts.SyntaxKind.SlashToken:
            case ts.SyntaxKind.PercentToken:
                return 14;
            case ts.SyntaxKind.AsteriskAsteriskToken:
                return 15;
        }
        // -1 is lower than all other precedences.  Returning it will cause binary expression
        // parsing to stop.
        return -1;
    }
    export function createDiagnosticCollection(): ts.DiagnosticCollection {
        let nonFileDiagnostics = ([] as ts.Diagnostic[] as ts.SortedArray<ts.Diagnostic>); // See GH#19873
        const filesWithDiagnostics = ([] as string[] as ts.SortedArray<string>);
        const fileDiagnostics = ts.createMap<ts.SortedArray<ts.DiagnosticWithLocation>>();
        let hasReadNonFileDiagnostics = false;
        return {
            add,
            lookup,
            getGlobalDiagnostics,
            getDiagnostics,
            reattachFileDiagnostics
        };
        function reattachFileDiagnostics(newFile: ts.SourceFile): void {
            ts.forEach(fileDiagnostics.get(newFile.fileName), diagnostic => diagnostic.file = newFile);
        }
        function lookup(diagnostic: ts.Diagnostic): ts.Diagnostic | undefined {
            let diagnostics: ts.SortedArray<ts.Diagnostic> | undefined;
            if (diagnostic.file) {
                diagnostics = fileDiagnostics.get(diagnostic.file.fileName);
            }
            else {
                diagnostics = nonFileDiagnostics;
            }
            if (!diagnostics) {
                return undefined;
            }
            const result = ts.binarySearch(diagnostics, diagnostic, ts.identity, compareDiagnosticsSkipRelatedInformation);
            if (result >= 0) {
                return diagnostics[result];
            }
            return undefined;
        }
        function add(diagnostic: ts.Diagnostic): void {
            let diagnostics: ts.SortedArray<ts.Diagnostic> | undefined;
            if (diagnostic.file) {
                diagnostics = fileDiagnostics.get(diagnostic.file.fileName);
                if (!diagnostics) {
                    diagnostics = ([] as ts.Diagnostic[] as ts.SortedArray<ts.DiagnosticWithLocation>); // See GH#19873
                    fileDiagnostics.set(diagnostic.file.fileName, (diagnostics as ts.SortedArray<ts.DiagnosticWithLocation>));
                    ts.insertSorted(filesWithDiagnostics, diagnostic.file.fileName, ts.compareStringsCaseSensitive);
                }
            }
            else {
                // If we've already read the non-file diagnostics, do not modify the existing array.
                if (hasReadNonFileDiagnostics) {
                    hasReadNonFileDiagnostics = false;
                    nonFileDiagnostics = (nonFileDiagnostics.slice() as ts.SortedArray<ts.Diagnostic>);
                }
                diagnostics = nonFileDiagnostics;
            }
            ts.insertSorted(diagnostics, diagnostic, compareDiagnostics);
        }
        function getGlobalDiagnostics(): ts.Diagnostic[] {
            hasReadNonFileDiagnostics = true;
            return nonFileDiagnostics;
        }
        function getDiagnostics(fileName: string): ts.DiagnosticWithLocation[];
        function getDiagnostics(): ts.Diagnostic[];
        function getDiagnostics(fileName?: string): ts.Diagnostic[] {
            if (fileName) {
                return fileDiagnostics.get(fileName) || [];
            }
            const fileDiags: ts.Diagnostic[] = ts.flatMapToMutable(filesWithDiagnostics, f => fileDiagnostics.get(f));
            if (!nonFileDiagnostics.length) {
                return fileDiags;
            }
            fileDiags.unshift(...nonFileDiagnostics);
            return fileDiags;
        }
    }
    const templateSubstitutionRegExp = /\$\{/g;
    function escapeTemplateSubstitution(str: string): string {
        return str.replace(templateSubstitutionRegExp, "\\${");
    }
    // This consists of the first 19 unprintable ASCII characters, canonical escapes, lineSeparator,
    // paragraphSeparator, and nextLine. The latter three are just desirable to suppress new lines in
    // the language service. These characters should be escaped when printing, and if any characters are added,
    // the map below must be updated. Note that this regexp *does not* include the 'delete' character.
    // There is no reason for this other than that JSON.stringify does not handle it either.
    const doubleQuoteEscapedCharsRegExp = /[\\\"\u0000-\u001f\t\v\f\b\r\n\u2028\u2029\u0085]/g;
    const singleQuoteEscapedCharsRegExp = /[\\\'\u0000-\u001f\t\v\f\b\r\n\u2028\u2029\u0085]/g;
    // Template strings should be preserved as much as possible
    const backtickQuoteEscapedCharsRegExp = /[\\\`]/g;
    const escapedCharsMap = ts.createMapFromTemplate({
        "\t": "\\t",
        "\v": "\\v",
        "\f": "\\f",
        "\b": "\\b",
        "\r": "\\r",
        "\n": "\\n",
        "\\": "\\\\",
        "\"": "\\\"",
        "\'": "\\\'",
        "\`": "\\\`",
        "\u2028": "\\u2028",
        "\u2029": "\\u2029",
        "\u0085": "\\u0085" // nextLine
    });
    /**
     * Based heavily on the abstract 'Quote'/'QuoteJSONString' operation from ECMA-262 (24.3.2.2),
     * but augmented for a few select characters (e.g. lineSeparator, paragraphSeparator, nextLine)
     * Note that this doesn't actually wrap the input in double quotes.
     */
    export function escapeString(s: string, quoteChar?: ts.CharacterCodes.doubleQuote | ts.CharacterCodes.singleQuote | ts.CharacterCodes.backtick): string {
        const escapedCharsRegExp = quoteChar === ts.CharacterCodes.backtick ? backtickQuoteEscapedCharsRegExp :
            quoteChar === ts.CharacterCodes.singleQuote ? singleQuoteEscapedCharsRegExp :
                doubleQuoteEscapedCharsRegExp;
        return s.replace(escapedCharsRegExp, getReplacement);
    }
    /**
     * Strip off existed surrounding single quotes, double quotes, or backticks from a given string
     *
     * @return non-quoted string
     */
    export function stripQuotes(name: string) {
        const length = name.length;
        if (length >= 2 && name.charCodeAt(0) === name.charCodeAt(length - 1) && isQuoteOrBacktick(name.charCodeAt(0))) {
            return name.substring(1, length - 1);
        }
        return name;
    }
    function isQuoteOrBacktick(charCode: number) {
        return charCode === ts.CharacterCodes.singleQuote ||
            charCode === ts.CharacterCodes.doubleQuote ||
            charCode === ts.CharacterCodes.backtick;
    }
    function getReplacement(c: string, offset: number, input: string) {
        if (c.charCodeAt(0) === ts.CharacterCodes.nullCharacter) {
            const lookAhead = input.charCodeAt(offset + c.length);
            if (lookAhead >= ts.CharacterCodes._0 && lookAhead <= ts.CharacterCodes._9) {
                // If the null character is followed by digits, print as a hex escape to prevent the result from parsing as an octal (which is forbidden in strict mode)
                return "\\x00";
            }
            // Otherwise, keep printing a literal \0 for the null character
            return "\\0";
        }
        return escapedCharsMap.get(c) || get16BitUnicodeEscapeSequence(c.charCodeAt(0));
    }
    export function isIntrinsicJsxName(name: ts.__String | string) {
        const ch = (name as string).charCodeAt(0);
        return (ch >= ts.CharacterCodes.a && ch <= ts.CharacterCodes.z) || ts.stringContains((name as string), "-");
    }
    function get16BitUnicodeEscapeSequence(charCode: number): string {
        const hexCharCode = charCode.toString(16).toUpperCase();
        const paddedHexCode = ("0000" + hexCharCode).slice(-4);
        return "\\u" + paddedHexCode;
    }
    const nonAsciiCharacters = /[^\u0000-\u007F]/g;
    export function escapeNonAsciiString(s: string, quoteChar?: ts.CharacterCodes.doubleQuote | ts.CharacterCodes.singleQuote | ts.CharacterCodes.backtick): string {
        s = escapeString(s, quoteChar);
        // Replace non-ASCII characters with '\uNNNN' escapes if any exist.
        // Otherwise just return the original string.
        return nonAsciiCharacters.test(s) ?
            s.replace(nonAsciiCharacters, c => get16BitUnicodeEscapeSequence(c.charCodeAt(0))) :
            s;
    }
    const indentStrings: string[] = ["", "    "];
    export function getIndentString(level: number) {
        if (indentStrings[level] === undefined) {
            indentStrings[level] = getIndentString(level - 1) + indentStrings[1];
        }
        return indentStrings[level];
    }
    export function getIndentSize() {
        return indentStrings[1].length;
    }
    export function createTextWriter(newLine: string): ts.EmitTextWriter {
        let output: string;
        let indent: number;
        let lineStart: boolean;
        let lineCount: number;
        let linePos: number;
        let hasTrailingComment = false;
        function updateLineCountAndPosFor(s: string) {
            const lineStartsOfS = ts.computeLineStarts(s);
            if (lineStartsOfS.length > 1) {
                lineCount = lineCount + lineStartsOfS.length - 1;
                linePos = output.length - s.length + ts.last(lineStartsOfS);
                lineStart = (linePos - output.length) === 0;
            }
            else {
                lineStart = false;
            }
        }
        function writeText(s: string) {
            if (s && s.length) {
                if (lineStart) {
                    s = getIndentString(indent) + s;
                    lineStart = false;
                }
                output += s;
                updateLineCountAndPosFor(s);
            }
        }
        function write(s: string) {
            if (s)
                hasTrailingComment = false;
            writeText(s);
        }
        function writeComment(s: string) {
            if (s)
                hasTrailingComment = true;
            writeText(s);
        }
        function reset(): void {
            output = "";
            indent = 0;
            lineStart = true;
            lineCount = 0;
            linePos = 0;
            hasTrailingComment = false;
        }
        function rawWrite(s: string) {
            if (s !== undefined) {
                output += s;
                updateLineCountAndPosFor(s);
                hasTrailingComment = false;
            }
        }
        function writeLiteral(s: string) {
            if (s && s.length) {
                write(s);
            }
        }
        function writeLine() {
            if (!lineStart) {
                output += newLine;
                lineCount++;
                linePos = output.length;
                lineStart = true;
                hasTrailingComment = false;
            }
        }
        function getTextPosWithWriteLine() {
            return lineStart ? output.length : (output.length + newLine.length);
        }
        reset();
        return {
            write,
            rawWrite,
            writeLiteral,
            writeLine,
            increaseIndent: () => { indent++; },
            decreaseIndent: () => { indent--; },
            getIndent: () => indent,
            getTextPos: () => output.length,
            getLine: () => lineCount,
            getColumn: () => lineStart ? indent * getIndentSize() : output.length - linePos,
            getText: () => output,
            isAtStartOfLine: () => lineStart,
            hasTrailingComment: () => hasTrailingComment,
            hasTrailingWhitespace: () => !!output.length && ts.isWhiteSpaceLike(output.charCodeAt(output.length - 1)),
            clear: reset,
            reportInaccessibleThisError: ts.noop,
            reportPrivateInBaseOfClassExpression: ts.noop,
            reportInaccessibleUniqueSymbolError: ts.noop,
            trackSymbol: ts.noop,
            writeKeyword: write,
            writeOperator: write,
            writeParameter: write,
            writeProperty: write,
            writePunctuation: write,
            writeSpace: write,
            writeStringLiteral: write,
            writeSymbol: (s, _) => write(s),
            writeTrailingSemicolon: write,
            writeComment,
            getTextPosWithWriteLine
        };
    }
    export function getTrailingSemicolonDeferringWriter(writer: ts.EmitTextWriter): ts.EmitTextWriter {
        let pendingTrailingSemicolon = false;
        function commitPendingTrailingSemicolon() {
            if (pendingTrailingSemicolon) {
                writer.writeTrailingSemicolon(";");
                pendingTrailingSemicolon = false;
            }
        }
        return {
            ...writer,
            writeTrailingSemicolon() {
                pendingTrailingSemicolon = true;
            },
            writeLiteral(s) {
                commitPendingTrailingSemicolon();
                writer.writeLiteral(s);
            },
            writeStringLiteral(s) {
                commitPendingTrailingSemicolon();
                writer.writeStringLiteral(s);
            },
            writeSymbol(s, sym) {
                commitPendingTrailingSemicolon();
                writer.writeSymbol(s, sym);
            },
            writePunctuation(s) {
                commitPendingTrailingSemicolon();
                writer.writePunctuation(s);
            },
            writeKeyword(s) {
                commitPendingTrailingSemicolon();
                writer.writeKeyword(s);
            },
            writeOperator(s) {
                commitPendingTrailingSemicolon();
                writer.writeOperator(s);
            },
            writeParameter(s) {
                commitPendingTrailingSemicolon();
                writer.writeParameter(s);
            },
            writeSpace(s) {
                commitPendingTrailingSemicolon();
                writer.writeSpace(s);
            },
            writeProperty(s) {
                commitPendingTrailingSemicolon();
                writer.writeProperty(s);
            },
            writeComment(s) {
                commitPendingTrailingSemicolon();
                writer.writeComment(s);
            },
            writeLine() {
                commitPendingTrailingSemicolon();
                writer.writeLine();
            },
            increaseIndent() {
                commitPendingTrailingSemicolon();
                writer.increaseIndent();
            },
            decreaseIndent() {
                commitPendingTrailingSemicolon();
                writer.decreaseIndent();
            },
        };
    }
    export interface ResolveModuleNameResolutionHost {
        getCanonicalFileName(p: string): string;
        getCommonSourceDirectory(): string;
        getCurrentDirectory(): string;
    }
    export function getResolvedExternalModuleName(host: ResolveModuleNameResolutionHost, file: ts.SourceFile, referenceFile?: ts.SourceFile): string {
        return file.moduleName || getExternalModuleNameFromPath(host, file.fileName, referenceFile && referenceFile.fileName);
    }
    export function getExternalModuleNameFromDeclaration(host: ResolveModuleNameResolutionHost, resolver: ts.EmitResolver, declaration: ts.ImportEqualsDeclaration | ts.ImportDeclaration | ts.ExportDeclaration | ts.ModuleDeclaration | ts.ImportTypeNode): string | undefined {
        const file = resolver.getExternalModuleFileFromDeclaration(declaration);
        if (!file || file.isDeclarationFile) {
            return undefined;
        }
        return getResolvedExternalModuleName(host, file);
    }
    /**
     * Resolves a local path to a path which is absolute to the base of the emit
     */
    export function getExternalModuleNameFromPath(host: ResolveModuleNameResolutionHost, fileName: string, referencePath?: string): string {
        const getCanonicalFileName = (f: string) => host.getCanonicalFileName(f);
        const dir = ts.toPath(referencePath ? ts.getDirectoryPath(referencePath) : host.getCommonSourceDirectory(), host.getCurrentDirectory(), getCanonicalFileName);
        const filePath = ts.getNormalizedAbsolutePath(fileName, host.getCurrentDirectory());
        const relativePath = ts.getRelativePathToDirectoryOrUrl(dir, filePath, dir, getCanonicalFileName, /*isAbsolutePathAnUrl*/ false);
        const extensionless = removeFileExtension(relativePath);
        return referencePath ? ts.ensurePathIsNonModuleName(extensionless) : extensionless;
    }
    export function getOwnEmitOutputFilePath(fileName: string, host: ts.EmitHost, extension: string) {
        const compilerOptions = host.getCompilerOptions();
        let emitOutputFilePathWithoutExtension: string;
        if (compilerOptions.outDir) {
            emitOutputFilePathWithoutExtension = removeFileExtension(getSourceFilePathInNewDir(fileName, host, compilerOptions.outDir));
        }
        else {
            emitOutputFilePathWithoutExtension = removeFileExtension(fileName);
        }
        return emitOutputFilePathWithoutExtension + extension;
    }
    export function getDeclarationEmitOutputFilePath(fileName: string, host: ts.EmitHost) {
        return getDeclarationEmitOutputFilePathWorker(fileName, host.getCompilerOptions(), host.getCurrentDirectory(), host.getCommonSourceDirectory(), f => host.getCanonicalFileName(f));
    }
    export function getDeclarationEmitOutputFilePathWorker(fileName: string, options: ts.CompilerOptions, currentDirectory: string, commonSourceDirectory: string, getCanonicalFileName: ts.GetCanonicalFileName): string {
        const outputDir = options.declarationDir || options.outDir; // Prefer declaration folder if specified
        const path = outputDir
            ? getSourceFilePathInNewDirWorker(fileName, outputDir, currentDirectory, commonSourceDirectory, getCanonicalFileName)
            : fileName;
        return removeFileExtension(path) + ts.Extension.Dts;
    }
    export interface EmitFileNames {
        jsFilePath?: string | undefined;
        sourceMapFilePath?: string | undefined;
        declarationFilePath?: string | undefined;
        declarationMapPath?: string | undefined;
        buildInfoPath?: string | undefined;
    }
    /**
     * Gets the source files that are expected to have an emit output.
     *
     * Originally part of `forEachExpectedEmitFile`, this functionality was extracted to support
     * transformations.
     *
     * @param host An EmitHost.
     * @param targetSourceFile An optional target source file to emit.
     */
    export function getSourceFilesToEmit(host: ts.EmitHost, targetSourceFile?: ts.SourceFile, forceDtsEmit?: boolean): readonly ts.SourceFile[] {
        const options = host.getCompilerOptions();
        if (options.outFile || options.out) {
            const moduleKind = getEmitModuleKind(options);
            const moduleEmitEnabled = options.emitDeclarationOnly || moduleKind === ts.ModuleKind.AMD || moduleKind === ts.ModuleKind.System;
            // Can emit only sources that are not declaration file and are either non module code or module with --module or --target es6 specified
            return ts.filter(host.getSourceFiles(), sourceFile => (moduleEmitEnabled || !ts.isExternalModule(sourceFile)) &&
                sourceFileMayBeEmitted(sourceFile, host, forceDtsEmit));
        }
        else {
            const sourceFiles = targetSourceFile === undefined ? host.getSourceFiles() : [targetSourceFile];
            return ts.filter(sourceFiles, sourceFile => sourceFileMayBeEmitted(sourceFile, host, forceDtsEmit));
        }
    }
    /** Don't call this for `--outFile`, just for `--outDir` or plain emit. `--outFile` needs additional checks. */
    export function sourceFileMayBeEmitted(sourceFile: ts.SourceFile, host: ts.SourceFileMayBeEmittedHost, forceDtsEmit?: boolean) {
        const options = host.getCompilerOptions();
        return !(options.noEmitForJsFiles && isSourceFileJS(sourceFile)) &&
            !sourceFile.isDeclarationFile &&
            !host.isSourceFileFromExternalLibrary(sourceFile) &&
            !(isJsonSourceFile(sourceFile) && host.getResolvedProjectReferenceToRedirect(sourceFile.fileName)) &&
            (forceDtsEmit || !host.isSourceOfProjectReferenceRedirect(sourceFile.fileName));
    }
    export function getSourceFilePathInNewDir(fileName: string, host: ts.EmitHost, newDirPath: string): string {
        return getSourceFilePathInNewDirWorker(fileName, newDirPath, host.getCurrentDirectory(), host.getCommonSourceDirectory(), f => host.getCanonicalFileName(f));
    }
    export function getSourceFilePathInNewDirWorker(fileName: string, newDirPath: string, currentDirectory: string, commonSourceDirectory: string, getCanonicalFileName: ts.GetCanonicalFileName): string {
        let sourceFilePath = ts.getNormalizedAbsolutePath(fileName, currentDirectory);
        const isSourceFileInCommonSourceDirectory = getCanonicalFileName(sourceFilePath).indexOf(getCanonicalFileName(commonSourceDirectory)) === 0;
        sourceFilePath = isSourceFileInCommonSourceDirectory ? sourceFilePath.substring(commonSourceDirectory.length) : sourceFilePath;
        return ts.combinePaths(newDirPath, sourceFilePath);
    }
    export function writeFile(host: {
        writeFile: ts.WriteFileCallback;
    }, diagnostics: ts.DiagnosticCollection, fileName: string, data: string, writeByteOrderMark: boolean, sourceFiles?: readonly ts.SourceFile[]) {
        host.writeFile(fileName, data, writeByteOrderMark, hostErrorMessage => {
            diagnostics.add(createCompilerDiagnostic(ts.Diagnostics.Could_not_write_file_0_Colon_1, fileName, hostErrorMessage));
        }, sourceFiles);
    }
    function ensureDirectoriesExist(directoryPath: string, createDirectory: (path: string) => void, directoryExists: (path: string) => boolean): void {
        if (directoryPath.length > ts.getRootLength(directoryPath) && !directoryExists(directoryPath)) {
            const parentDirectory = ts.getDirectoryPath(directoryPath);
            ensureDirectoriesExist(parentDirectory, createDirectory, directoryExists);
            createDirectory(directoryPath);
        }
    }
    export function writeFileEnsuringDirectories(path: string, data: string, writeByteOrderMark: boolean, writeFile: (path: string, data: string, writeByteOrderMark: boolean) => void, createDirectory: (path: string) => void, directoryExists: (path: string) => boolean): void {
        // PERF: Checking for directory existence is expensive.  Instead, assume the directory exists
        // and fall back to creating it if the file write fails.
        try {
            writeFile(path, data, writeByteOrderMark);
        }
        catch {
            ensureDirectoriesExist(ts.getDirectoryPath(ts.normalizePath(path)), createDirectory, directoryExists);
            writeFile(path, data, writeByteOrderMark);
        }
    }
    export function getLineOfLocalPosition(currentSourceFile: ts.SourceFile, pos: number) {
        return ts.getLineAndCharacterOfPosition(currentSourceFile, pos).line;
    }
    export function getLineOfLocalPositionFromLineMap(lineMap: readonly number[], pos: number) {
        return ts.computeLineAndCharacterOfPosition(lineMap, pos).line;
    }
    export function getFirstConstructorWithBody(node: ts.ClassLikeDeclaration): (ts.ConstructorDeclaration & {
        body: ts.FunctionBody;
    }) | undefined {
        return ts.find(node.members, (member): member is ts.ConstructorDeclaration & {
            body: ts.FunctionBody;
        } => ts.isConstructorDeclaration(member) && nodeIsPresent(member.body));
    }
    export function getSetAccessorValueParameter(accessor: ts.SetAccessorDeclaration): ts.ParameterDeclaration | undefined {
        if (accessor && accessor.parameters.length > 0) {
            const hasThis = accessor.parameters.length === 2 && parameterIsThisKeyword(accessor.parameters[0]);
            return accessor.parameters[hasThis ? 1 : 0];
        }
    }
    /** Get the type annotation for the value parameter. */
    export function getSetAccessorTypeAnnotationNode(accessor: ts.SetAccessorDeclaration): ts.TypeNode | undefined {
        const parameter = getSetAccessorValueParameter(accessor);
        return parameter && parameter.type;
    }
    export function getThisParameter(signature: ts.SignatureDeclaration | ts.JSDocSignature): ts.ParameterDeclaration | undefined {
        // callback tags do not currently support this parameters
        if (signature.parameters.length && !ts.isJSDocSignature(signature)) {
            const thisParameter = signature.parameters[0];
            if (parameterIsThisKeyword(thisParameter)) {
                return thisParameter;
            }
        }
    }
    export function parameterIsThisKeyword(parameter: ts.ParameterDeclaration): boolean {
        return isThisIdentifier(parameter.name);
    }
    export function isThisIdentifier(node: ts.Node | undefined): boolean {
        return !!node && node.kind === ts.SyntaxKind.Identifier && identifierIsThisKeyword((node as ts.Identifier));
    }
    export function identifierIsThisKeyword(id: ts.Identifier): boolean {
        return id.originalKeywordKind === ts.SyntaxKind.ThisKeyword;
    }
    export function getAllAccessorDeclarations(declarations: readonly ts.Declaration[], accessor: ts.AccessorDeclaration): ts.AllAccessorDeclarations {
        // TODO: GH#18217
        let firstAccessor!: ts.AccessorDeclaration;
        let secondAccessor!: ts.AccessorDeclaration;
        let getAccessor!: ts.GetAccessorDeclaration;
        let setAccessor!: ts.SetAccessorDeclaration;
        if (hasDynamicName(accessor)) {
            firstAccessor = accessor;
            if (accessor.kind === ts.SyntaxKind.GetAccessor) {
                getAccessor = accessor;
            }
            else if (accessor.kind === ts.SyntaxKind.SetAccessor) {
                setAccessor = accessor;
            }
            else {
                ts.Debug.fail("Accessor has wrong kind");
            }
        }
        else {
            ts.forEach(declarations, member => {
                if (ts.isAccessor(member)
                    && hasModifier(member, ts.ModifierFlags.Static) === hasModifier(accessor, ts.ModifierFlags.Static)) {
                    const memberName = getPropertyNameForPropertyNameNode(member.name);
                    const accessorName = getPropertyNameForPropertyNameNode(accessor.name);
                    if (memberName === accessorName) {
                        if (!firstAccessor) {
                            firstAccessor = member;
                        }
                        else if (!secondAccessor) {
                            secondAccessor = member;
                        }
                        if (member.kind === ts.SyntaxKind.GetAccessor && !getAccessor) {
                            getAccessor = (<ts.GetAccessorDeclaration>member);
                        }
                        if (member.kind === ts.SyntaxKind.SetAccessor && !setAccessor) {
                            setAccessor = (<ts.SetAccessorDeclaration>member);
                        }
                    }
                }
            });
        }
        return {
            firstAccessor,
            secondAccessor,
            getAccessor,
            setAccessor
        };
    }
    /**
     * Gets the effective type annotation of a variable, parameter, or property. If the node was
     * parsed in a JavaScript file, gets the type annotation from JSDoc.
     */
    export function getEffectiveTypeAnnotationNode(node: ts.Node): ts.TypeNode | undefined {
        const type = (node as ts.HasType).type;
        if (type || !isInJSFile(node))
            return type;
        return ts.isJSDocPropertyLikeTag(node) ? node.typeExpression && node.typeExpression.type : ts.getJSDocType(node);
    }
    export function getTypeAnnotationNode(node: ts.Node): ts.TypeNode | undefined {
        return (node as ts.HasType).type;
    }
    /**
     * Gets the effective return type annotation of a signature. If the node was parsed in a
     * JavaScript file, gets the return type annotation from JSDoc.
     */
    export function getEffectiveReturnTypeNode(node: ts.SignatureDeclaration | ts.JSDocSignature): ts.TypeNode | undefined {
        return ts.isJSDocSignature(node) ?
            node.type && node.type.typeExpression && node.type.typeExpression.type :
            node.type || (isInJSFile(node) ? ts.getJSDocReturnType(node) : undefined);
    }
    export function getJSDocTypeParameterDeclarations(node: ts.DeclarationWithTypeParameters): readonly ts.TypeParameterDeclaration[] {
        return ts.flatMap(ts.getJSDocTags(node), tag => isNonTypeAliasTemplate(tag) ? tag.typeParameters : undefined);
    }
    /** template tags are only available when a typedef isn't already using them */
    function isNonTypeAliasTemplate(tag: ts.JSDocTag): tag is ts.JSDocTemplateTag {
        return ts.isJSDocTemplateTag(tag) && !(tag.parent.kind === ts.SyntaxKind.JSDocComment && tag.parent.tags!.some(isJSDocTypeAlias));
    }
    /**
     * Gets the effective type annotation of the value parameter of a set accessor. If the node
     * was parsed in a JavaScript file, gets the type annotation from JSDoc.
     */
    export function getEffectiveSetAccessorTypeAnnotationNode(node: ts.SetAccessorDeclaration): ts.TypeNode | undefined {
        const parameter = getSetAccessorValueParameter(node);
        return parameter && getEffectiveTypeAnnotationNode(parameter);
    }
    export function emitNewLineBeforeLeadingComments(lineMap: readonly number[], writer: ts.EmitTextWriter, node: ts.TextRange, leadingComments: readonly ts.CommentRange[] | undefined) {
        emitNewLineBeforeLeadingCommentsOfPosition(lineMap, writer, node.pos, leadingComments);
    }
    export function emitNewLineBeforeLeadingCommentsOfPosition(lineMap: readonly number[], writer: ts.EmitTextWriter, pos: number, leadingComments: readonly ts.CommentRange[] | undefined) {
        // If the leading comments start on different line than the start of node, write new line
        if (leadingComments && leadingComments.length && pos !== leadingComments[0].pos &&
            getLineOfLocalPositionFromLineMap(lineMap, pos) !== getLineOfLocalPositionFromLineMap(lineMap, leadingComments[0].pos)) {
            writer.writeLine();
        }
    }
    export function emitNewLineBeforeLeadingCommentOfPosition(lineMap: readonly number[], writer: ts.EmitTextWriter, pos: number, commentPos: number) {
        // If the leading comments start on different line than the start of node, write new line
        if (pos !== commentPos &&
            getLineOfLocalPositionFromLineMap(lineMap, pos) !== getLineOfLocalPositionFromLineMap(lineMap, commentPos)) {
            writer.writeLine();
        }
    }
    export function emitComments(text: string, lineMap: readonly number[], writer: ts.EmitTextWriter, comments: readonly ts.CommentRange[] | undefined, leadingSeparator: boolean, trailingSeparator: boolean, newLine: string, writeComment: (text: string, lineMap: readonly number[], writer: ts.EmitTextWriter, commentPos: number, commentEnd: number, newLine: string) => void) {
        if (comments && comments.length > 0) {
            if (leadingSeparator) {
                writer.writeSpace(" ");
            }
            let emitInterveningSeparator = false;
            for (const comment of comments) {
                if (emitInterveningSeparator) {
                    writer.writeSpace(" ");
                    emitInterveningSeparator = false;
                }
                writeComment(text, lineMap, writer, comment.pos, comment.end, newLine);
                if (comment.hasTrailingNewLine) {
                    writer.writeLine();
                }
                else {
                    emitInterveningSeparator = true;
                }
            }
            if (emitInterveningSeparator && trailingSeparator) {
                writer.writeSpace(" ");
            }
        }
    }
    /**
     * Detached comment is a comment at the top of file or function body that is separated from
     * the next statement by space.
     */
    export function emitDetachedComments(text: string, lineMap: readonly number[], writer: ts.EmitTextWriter, writeComment: (text: string, lineMap: readonly number[], writer: ts.EmitTextWriter, commentPos: number, commentEnd: number, newLine: string) => void, node: ts.TextRange, newLine: string, removeComments: boolean) {
        let leadingComments: ts.CommentRange[] | undefined;
        let currentDetachedCommentInfo: {
            nodePos: number;
            detachedCommentEndPos: number;
        } | undefined;
        if (removeComments) {
            // removeComments is true, only reserve pinned comment at the top of file
            // For example:
            //      /*! Pinned Comment */
            //
            //      var x = 10;
            if (node.pos === 0) {
                leadingComments = ts.filter(ts.getLeadingCommentRanges(text, node.pos), isPinnedCommentLocal);
            }
        }
        else {
            // removeComments is false, just get detached as normal and bypass the process to filter comment
            leadingComments = ts.getLeadingCommentRanges(text, node.pos);
        }
        if (leadingComments) {
            const detachedComments: ts.CommentRange[] = [];
            let lastComment: ts.CommentRange | undefined;
            for (const comment of leadingComments) {
                if (lastComment) {
                    const lastCommentLine = getLineOfLocalPositionFromLineMap(lineMap, lastComment.end);
                    const commentLine = getLineOfLocalPositionFromLineMap(lineMap, comment.pos);
                    if (commentLine >= lastCommentLine + 2) {
                        // There was a blank line between the last comment and this comment.  This
                        // comment is not part of the copyright comments.  Return what we have so
                        // far.
                        break;
                    }
                }
                detachedComments.push(comment);
                lastComment = comment;
            }
            if (detachedComments.length) {
                // All comments look like they could have been part of the copyright header.  Make
                // sure there is at least one blank line between it and the node.  If not, it's not
                // a copyright header.
                const lastCommentLine = getLineOfLocalPositionFromLineMap(lineMap, ts.last(detachedComments).end);
                const nodeLine = getLineOfLocalPositionFromLineMap(lineMap, ts.skipTrivia(text, node.pos));
                if (nodeLine >= lastCommentLine + 2) {
                    // Valid detachedComments
                    emitNewLineBeforeLeadingComments(lineMap, writer, node, leadingComments);
                    emitComments(text, lineMap, writer, detachedComments, /*leadingSeparator*/ false, /*trailingSeparator*/ true, newLine, writeComment);
                    currentDetachedCommentInfo = { nodePos: node.pos, detachedCommentEndPos: ts.last(detachedComments).end };
                }
            }
        }
        return currentDetachedCommentInfo;
        function isPinnedCommentLocal(comment: ts.CommentRange) {
            return isPinnedComment(text, comment.pos);
        }
    }
    export function writeCommentRange(text: string, lineMap: readonly number[], writer: ts.EmitTextWriter, commentPos: number, commentEnd: number, newLine: string) {
        if (text.charCodeAt(commentPos + 1) === ts.CharacterCodes.asterisk) {
            const firstCommentLineAndCharacter = ts.computeLineAndCharacterOfPosition(lineMap, commentPos);
            const lineCount = lineMap.length;
            let firstCommentLineIndent: number | undefined;
            for (let pos = commentPos, currentLine = firstCommentLineAndCharacter.line; pos < commentEnd; currentLine++) {
                const nextLineStart = (currentLine + 1) === lineCount
                    ? text.length + 1
                    : lineMap[currentLine + 1];
                if (pos !== commentPos) {
                    // If we are not emitting first line, we need to write the spaces to adjust the alignment
                    if (firstCommentLineIndent === undefined) {
                        firstCommentLineIndent = calculateIndent(text, lineMap[firstCommentLineAndCharacter.line], commentPos);
                    }
                    // These are number of spaces writer is going to write at current indent
                    const currentWriterIndentSpacing = writer.getIndent() * getIndentSize();
                    // Number of spaces we want to be writing
                    // eg: Assume writer indent
                    // module m {
                    //         /* starts at character 9 this is line 1
                    //    * starts at character pos 4 line                        --1  = 8 - 8 + 3
                    //   More left indented comment */                            --2  = 8 - 8 + 2
                    //     class c { }
                    // }
                    // module m {
                    //     /* this is line 1 -- Assume current writer indent 8
                    //      * line                                                --3 = 8 - 4 + 5
                    //            More right indented comment */                  --4 = 8 - 4 + 11
                    //     class c { }
                    // }
                    const spacesToEmit = currentWriterIndentSpacing - firstCommentLineIndent + calculateIndent(text, pos, nextLineStart);
                    if (spacesToEmit > 0) {
                        let numberOfSingleSpacesToEmit = spacesToEmit % getIndentSize();
                        const indentSizeSpaceString = getIndentString((spacesToEmit - numberOfSingleSpacesToEmit) / getIndentSize());
                        // Write indent size string ( in eg 1: = "", 2: "" , 3: string with 8 spaces 4: string with 12 spaces
                        writer.rawWrite(indentSizeSpaceString);
                        // Emit the single spaces (in eg: 1: 3 spaces, 2: 2 spaces, 3: 1 space, 4: 3 spaces)
                        while (numberOfSingleSpacesToEmit) {
                            writer.rawWrite(" ");
                            numberOfSingleSpacesToEmit--;
                        }
                    }
                    else {
                        // No spaces to emit write empty string
                        writer.rawWrite("");
                    }
                }
                // Write the comment line text
                writeTrimmedCurrentLine(text, commentEnd, writer, newLine, pos, nextLineStart);
                pos = nextLineStart;
            }
        }
        else {
            // Single line comment of style //....
            writer.writeComment(text.substring(commentPos, commentEnd));
        }
    }
    function writeTrimmedCurrentLine(text: string, commentEnd: number, writer: ts.EmitTextWriter, newLine: string, pos: number, nextLineStart: number) {
        const end = Math.min(commentEnd, nextLineStart - 1);
        const currentLineText = text.substring(pos, end).replace(/^\s+|\s+$/g, "");
        if (currentLineText) {
            // trimmed forward and ending spaces text
            writer.writeComment(currentLineText);
            if (end !== commentEnd) {
                writer.writeLine();
            }
        }
        else {
            // Empty string - make sure we write empty line
            writer.rawWrite(newLine);
        }
    }
    function calculateIndent(text: string, pos: number, end: number) {
        let currentLineIndent = 0;
        for (; pos < end && ts.isWhiteSpaceSingleLine(text.charCodeAt(pos)); pos++) {
            if (text.charCodeAt(pos) === ts.CharacterCodes.tab) {
                // Tabs = TabSize = indent size and go to next tabStop
                currentLineIndent += getIndentSize() - (currentLineIndent % getIndentSize());
            }
            else {
                // Single space
                currentLineIndent++;
            }
        }
        return currentLineIndent;
    }
    export function hasModifiers(node: ts.Node) {
        return getModifierFlags(node) !== ts.ModifierFlags.None;
    }
    export function hasModifier(node: ts.Node, flags: ts.ModifierFlags): boolean {
        return !!getSelectedModifierFlags(node, flags);
    }
    export function hasStaticModifier(node: ts.Node): boolean {
        return hasModifier(node, ts.ModifierFlags.Static);
    }
    export function hasReadonlyModifier(node: ts.Node): boolean {
        return hasModifier(node, ts.ModifierFlags.Readonly);
    }
    export function getSelectedModifierFlags(node: ts.Node, flags: ts.ModifierFlags): ts.ModifierFlags {
        return getModifierFlags(node) & flags;
    }
    export function getModifierFlags(node: ts.Node): ts.ModifierFlags {
        if (node.modifierFlagsCache & ts.ModifierFlags.HasComputedFlags) {
            return node.modifierFlagsCache & ~ts.ModifierFlags.HasComputedFlags;
        }
        const flags = getModifierFlagsNoCache(node);
        node.modifierFlagsCache = flags | ts.ModifierFlags.HasComputedFlags;
        return flags;
    }
    export function getModifierFlagsNoCache(node: ts.Node): ts.ModifierFlags {
        let flags = ts.ModifierFlags.None;
        if (node.modifiers) {
            for (const modifier of node.modifiers) {
                flags |= modifierToFlag(modifier.kind);
            }
        }
        if (node.flags & ts.NodeFlags.NestedNamespace || (node.kind === ts.SyntaxKind.Identifier && (<ts.Identifier>node).isInJSDocNamespace)) {
            flags |= ts.ModifierFlags.Export;
        }
        return flags;
    }
    export function modifierToFlag(token: ts.SyntaxKind): ts.ModifierFlags {
        switch (token) {
            case ts.SyntaxKind.StaticKeyword: return ts.ModifierFlags.Static;
            case ts.SyntaxKind.PublicKeyword: return ts.ModifierFlags.Public;
            case ts.SyntaxKind.ProtectedKeyword: return ts.ModifierFlags.Protected;
            case ts.SyntaxKind.PrivateKeyword: return ts.ModifierFlags.Private;
            case ts.SyntaxKind.AbstractKeyword: return ts.ModifierFlags.Abstract;
            case ts.SyntaxKind.ExportKeyword: return ts.ModifierFlags.Export;
            case ts.SyntaxKind.DeclareKeyword: return ts.ModifierFlags.Ambient;
            case ts.SyntaxKind.ConstKeyword: return ts.ModifierFlags.Const;
            case ts.SyntaxKind.DefaultKeyword: return ts.ModifierFlags.Default;
            case ts.SyntaxKind.AsyncKeyword: return ts.ModifierFlags.Async;
            case ts.SyntaxKind.ReadonlyKeyword: return ts.ModifierFlags.Readonly;
        }
        return ts.ModifierFlags.None;
    }
    export function isLogicalOperator(token: ts.SyntaxKind): boolean {
        return token === ts.SyntaxKind.BarBarToken
            || token === ts.SyntaxKind.AmpersandAmpersandToken
            || token === ts.SyntaxKind.ExclamationToken;
    }
    export function isAssignmentOperator(token: ts.SyntaxKind): boolean {
        return token >= ts.SyntaxKind.FirstAssignment && token <= ts.SyntaxKind.LastAssignment;
    }
    /** Get `C` given `N` if `N` is in the position `class C extends N` where `N` is an ExpressionWithTypeArguments. */
    export function tryGetClassExtendingExpressionWithTypeArguments(node: ts.Node): ts.ClassLikeDeclaration | undefined {
        const cls = tryGetClassImplementingOrExtendingExpressionWithTypeArguments(node);
        return cls && !cls.isImplements ? cls.class : undefined;
    }
    export interface ClassImplementingOrExtendingExpressionWithTypeArguments {
        readonly class: ts.ClassLikeDeclaration;
        readonly isImplements: boolean;
    }
    export function tryGetClassImplementingOrExtendingExpressionWithTypeArguments(node: ts.Node): ClassImplementingOrExtendingExpressionWithTypeArguments | undefined {
        return ts.isExpressionWithTypeArguments(node)
            && ts.isHeritageClause(node.parent)
            && ts.isClassLike(node.parent.parent)
            ? { class: node.parent.parent, isImplements: node.parent.token === ts.SyntaxKind.ImplementsKeyword }
            : undefined;
    }
    export function isAssignmentExpression(node: ts.Node, excludeCompoundAssignment: true): node is ts.AssignmentExpression<ts.EqualsToken>;
    export function isAssignmentExpression(node: ts.Node, excludeCompoundAssignment?: false): node is ts.AssignmentExpression<ts.AssignmentOperatorToken>;
    export function isAssignmentExpression(node: ts.Node, excludeCompoundAssignment?: boolean): node is ts.AssignmentExpression<ts.AssignmentOperatorToken> {
        return ts.isBinaryExpression(node)
            && (excludeCompoundAssignment
                ? node.operatorToken.kind === ts.SyntaxKind.EqualsToken
                : isAssignmentOperator(node.operatorToken.kind))
            && ts.isLeftHandSideExpression(node.left);
    }
    export function isDestructuringAssignment(node: ts.Node): node is ts.DestructuringAssignment {
        if (isAssignmentExpression(node, /*excludeCompoundAssignment*/ true)) {
            const kind = node.left.kind;
            return kind === ts.SyntaxKind.ObjectLiteralExpression
                || kind === ts.SyntaxKind.ArrayLiteralExpression;
        }
        return false;
    }
    export function isExpressionWithTypeArgumentsInClassExtendsClause(node: ts.Node): node is ts.ExpressionWithTypeArguments {
        return tryGetClassExtendingExpressionWithTypeArguments(node) !== undefined;
    }
    export function isEntityNameExpression(node: ts.Node): node is ts.EntityNameExpression {
        return node.kind === ts.SyntaxKind.Identifier || isPropertyAccessEntityNameExpression(node);
    }
    export function getFirstIdentifier(node: ts.EntityNameOrEntityNameExpression): ts.Identifier {
        switch (node.kind) {
            case ts.SyntaxKind.Identifier:
                return node;
            case ts.SyntaxKind.QualifiedName:
                do {
                    node = node.left;
                } while (node.kind !== ts.SyntaxKind.Identifier);
                return node;
            case ts.SyntaxKind.PropertyAccessExpression:
                do {
                    node = node.expression;
                } while (node.kind !== ts.SyntaxKind.Identifier);
                return node;
        }
    }
    export function isDottedName(node: ts.Expression): boolean {
        return node.kind === ts.SyntaxKind.Identifier || node.kind === ts.SyntaxKind.ThisKeyword ||
            node.kind === ts.SyntaxKind.PropertyAccessExpression && isDottedName((<ts.PropertyAccessExpression>node).expression) ||
            node.kind === ts.SyntaxKind.ParenthesizedExpression && isDottedName((<ts.ParenthesizedExpression>node).expression);
    }
    export function isPropertyAccessEntityNameExpression(node: ts.Node): node is ts.PropertyAccessEntityNameExpression {
        return ts.isPropertyAccessExpression(node) && isEntityNameExpression(node.expression);
    }
    export function tryGetPropertyAccessOrIdentifierToString(expr: ts.Expression): string | undefined {
        if (ts.isPropertyAccessExpression(expr)) {
            const baseStr = tryGetPropertyAccessOrIdentifierToString(expr.expression);
            if (baseStr !== undefined) {
                return baseStr + "." + expr.name;
            }
        }
        else if (ts.isIdentifier(expr)) {
            return ts.unescapeLeadingUnderscores(expr.escapedText);
        }
        return undefined;
    }
    export function isPrototypeAccess(node: ts.Node): node is ts.BindableStaticAccessExpression {
        return isBindableStaticAccessExpression(node) && getElementOrPropertyAccessName(node) === "prototype";
    }
    export function isRightSideOfQualifiedNameOrPropertyAccess(node: ts.Node) {
        return (node.parent.kind === ts.SyntaxKind.QualifiedName && (<ts.QualifiedName>node.parent).right === node) ||
            (node.parent.kind === ts.SyntaxKind.PropertyAccessExpression && (<ts.PropertyAccessExpression>node.parent).name === node);
    }
    export function isEmptyObjectLiteral(expression: ts.Node): boolean {
        return expression.kind === ts.SyntaxKind.ObjectLiteralExpression &&
            (<ts.ObjectLiteralExpression>expression).properties.length === 0;
    }
    export function isEmptyArrayLiteral(expression: ts.Node): boolean {
        return expression.kind === ts.SyntaxKind.ArrayLiteralExpression &&
            (<ts.ArrayLiteralExpression>expression).elements.length === 0;
    }
    export function getLocalSymbolForExportDefault(symbol: ts.Symbol) {
        return isExportDefaultSymbol(symbol) ? symbol.declarations[0].localSymbol : undefined;
    }
    function isExportDefaultSymbol(symbol: ts.Symbol): boolean {
        return symbol && ts.length(symbol.declarations) > 0 && hasModifier(symbol.declarations[0], ts.ModifierFlags.Default);
    }
    /** Return ".ts", ".d.ts", or ".tsx", if that is the extension. */
    export function tryExtractTSExtension(fileName: string): string | undefined {
        return ts.find(supportedTSExtensionsForExtractExtension, extension => ts.fileExtensionIs(fileName, extension));
    }
    /**
     * Replace each instance of non-ascii characters by one, two, three, or four escape sequences
     * representing the UTF-8 encoding of the character, and return the expanded char code list.
     */
    function getExpandedCharCodes(input: string): number[] {
        const output: number[] = [];
        const length = input.length;
        for (let i = 0; i < length; i++) {
            const charCode = input.charCodeAt(i);
            // handle utf8
            if (charCode < 0x80) {
                output.push(charCode);
            }
            else if (charCode < 0x800) {
                output.push((charCode >> 6) | 0B11000000);
                output.push((charCode & 0B00111111) | 0B10000000);
            }
            else if (charCode < 0x10000) {
                output.push((charCode >> 12) | 0B11100000);
                output.push(((charCode >> 6) & 0B00111111) | 0B10000000);
                output.push((charCode & 0B00111111) | 0B10000000);
            }
            else if (charCode < 0x20000) {
                output.push((charCode >> 18) | 0B11110000);
                output.push(((charCode >> 12) & 0B00111111) | 0B10000000);
                output.push(((charCode >> 6) & 0B00111111) | 0B10000000);
                output.push((charCode & 0B00111111) | 0B10000000);
            }
            else {
                ts.Debug.assert(false, "Unexpected code point");
            }
        }
        return output;
    }
    const base64Digits = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    /**
     * Converts a string to a base-64 encoded ASCII string.
     */
    export function convertToBase64(input: string): string {
        let result = "";
        const charCodes = getExpandedCharCodes(input);
        let i = 0;
        const length = charCodes.length;
        let byte1: number, byte2: number, byte3: number, byte4: number;
        while (i < length) {
            // Convert every 6-bits in the input 3 character points
            // into a base64 digit
            byte1 = charCodes[i] >> 2;
            byte2 = (charCodes[i] & 0B00000011) << 4 | charCodes[i + 1] >> 4;
            byte3 = (charCodes[i + 1] & 0B00001111) << 2 | charCodes[i + 2] >> 6;
            byte4 = charCodes[i + 2] & 0B00111111;
            // We are out of characters in the input, set the extra
            // digits to 64 (padding character).
            if (i + 1 >= length) {
                byte3 = byte4 = 64;
            }
            else if (i + 2 >= length) {
                byte4 = 64;
            }
            // Write to the output
            result += base64Digits.charAt(byte1) + base64Digits.charAt(byte2) + base64Digits.charAt(byte3) + base64Digits.charAt(byte4);
            i += 3;
        }
        return result;
    }
    function getStringFromExpandedCharCodes(codes: number[]): string {
        let output = "";
        let i = 0;
        const length = codes.length;
        while (i < length) {
            const charCode = codes[i];
            if (charCode < 0x80) {
                output += String.fromCharCode(charCode);
                i++;
            }
            else if ((charCode & 0B11000000) === 0B11000000) {
                let value = charCode & 0B00111111;
                i++;
                let nextCode: number = codes[i];
                while ((nextCode & 0B11000000) === 0B10000000) {
                    value = (value << 6) | (nextCode & 0B00111111);
                    i++;
                    nextCode = codes[i];
                }
                // `value` may be greater than 10FFFF (the maximum unicode codepoint) - JS will just make this into an invalid character for us
                output += String.fromCharCode(value);
            }
            else {
                // We don't want to kill the process when decoding fails (due to a following char byte not
                // following a leading char), so we just print the (bad) value
                output += String.fromCharCode(charCode);
                i++;
            }
        }
        return output;
    }
    export function base64encode(host: {
        base64encode?(input: string): string;
    } | undefined, input: string): string {
        if (host && host.base64encode) {
            return host.base64encode(input);
        }
        return convertToBase64(input);
    }
    export function base64decode(host: {
        base64decode?(input: string): string;
    } | undefined, input: string): string {
        if (host && host.base64decode) {
            return host.base64decode(input);
        }
        const length = input.length;
        const expandedCharCodes: number[] = [];
        let i = 0;
        while (i < length) {
            // Stop decoding once padding characters are present
            if (input.charCodeAt(i) === base64Digits.charCodeAt(64)) {
                break;
            }
            // convert 4 input digits into three characters, ignoring padding characters at the end
            const ch1 = base64Digits.indexOf(input[i]);
            const ch2 = base64Digits.indexOf(input[i + 1]);
            const ch3 = base64Digits.indexOf(input[i + 2]);
            const ch4 = base64Digits.indexOf(input[i + 3]);
            const code1 = ((ch1 & 0B00111111) << 2) | ((ch2 >> 4) & 0B00000011);
            const code2 = ((ch2 & 0B00001111) << 4) | ((ch3 >> 2) & 0B00001111);
            const code3 = ((ch3 & 0B00000011) << 6) | (ch4 & 0B00111111);
            if (code2 === 0 && ch3 !== 0) { // code2 decoded to zero, but ch3 was padding - elide code2 and code3
                expandedCharCodes.push(code1);
            }
            else if (code3 === 0 && ch4 !== 0) { // code3 decoded to zero, but ch4 was padding, elide code3
                expandedCharCodes.push(code1, code2);
            }
            else {
                expandedCharCodes.push(code1, code2, code3);
            }
            i += 4;
        }
        return getStringFromExpandedCharCodes(expandedCharCodes);
    }
    export function readJson(path: string, host: {
        readFile(fileName: string): string | undefined;
    }): object {
        try {
            const jsonText = host.readFile(path);
            if (!jsonText)
                return {};
            const result = ts.parseConfigFileTextToJson(path, jsonText);
            if (result.error) {
                return {};
            }
            return result.config;
        }
        catch (e) {
            // gracefully handle if readFile fails or returns not JSON
            return {};
        }
    }
    export function directoryProbablyExists(directoryName: string, host: {
        directoryExists?: (directoryName: string) => boolean;
    }): boolean {
        // if host does not support 'directoryExists' assume that directory will exist
        return !host.directoryExists || host.directoryExists(directoryName);
    }
    const carriageReturnLineFeed = "\r\n";
    const lineFeed = "\n";
    export function getNewLineCharacter(options: ts.CompilerOptions | ts.PrinterOptions, getNewLine?: () => string): string {
        switch (options.newLine) {
            case ts.NewLineKind.CarriageReturnLineFeed:
                return carriageReturnLineFeed;
            case ts.NewLineKind.LineFeed:
                return lineFeed;
        }
        return getNewLine ? getNewLine() : ts.sys ? ts.sys.newLine : carriageReturnLineFeed;
    }
    /**
     * Creates a new TextRange from the provided pos and end.
     *
     * @param pos The start position.
     * @param end The end position.
     */
    export function createRange(pos: number, end: number = pos): ts.TextRange {
        ts.Debug.assert(end >= pos || end === -1);
        return { pos, end };
    }
    /**
     * Creates a new TextRange from a provided range with a new end position.
     *
     * @param range A TextRange.
     * @param end The new end position.
     */
    export function moveRangeEnd(range: ts.TextRange, end: number): ts.TextRange {
        return createRange(range.pos, end);
    }
    /**
     * Creates a new TextRange from a provided range with a new start position.
     *
     * @param range A TextRange.
     * @param pos The new Start position.
     */
    export function moveRangePos(range: ts.TextRange, pos: number): ts.TextRange {
        return createRange(pos, range.end);
    }
    /**
     * Moves the start position of a range past any decorators.
     */
    export function moveRangePastDecorators(node: ts.Node): ts.TextRange {
        return node.decorators && node.decorators.length > 0
            ? moveRangePos(node, node.decorators.end)
            : node;
    }
    /**
     * Moves the start position of a range past any decorators or modifiers.
     */
    export function moveRangePastModifiers(node: ts.Node): ts.TextRange {
        return node.modifiers && node.modifiers.length > 0
            ? moveRangePos(node, node.modifiers.end)
            : moveRangePastDecorators(node);
    }
    /**
     * Determines whether a TextRange has the same start and end positions.
     *
     * @param range A TextRange.
     */
    export function isCollapsedRange(range: ts.TextRange) {
        return range.pos === range.end;
    }
    /**
     * Creates a new TextRange for a token at the provides start position.
     *
     * @param pos The start position.
     * @param token The token.
     */
    export function createTokenRange(pos: number, token: ts.SyntaxKind): ts.TextRange {
        return createRange(pos, pos + ts.tokenToString(token)!.length);
    }
    export function rangeIsOnSingleLine(range: ts.TextRange, sourceFile: ts.SourceFile) {
        return rangeStartIsOnSameLineAsRangeEnd(range, range, sourceFile);
    }
    export function rangeStartPositionsAreOnSameLine(range1: ts.TextRange, range2: ts.TextRange, sourceFile: ts.SourceFile) {
        return positionsAreOnSameLine(getStartPositionOfRange(range1, sourceFile), getStartPositionOfRange(range2, sourceFile), sourceFile);
    }
    export function rangeEndPositionsAreOnSameLine(range1: ts.TextRange, range2: ts.TextRange, sourceFile: ts.SourceFile) {
        return positionsAreOnSameLine(range1.end, range2.end, sourceFile);
    }
    export function rangeStartIsOnSameLineAsRangeEnd(range1: ts.TextRange, range2: ts.TextRange, sourceFile: ts.SourceFile) {
        return positionsAreOnSameLine(getStartPositionOfRange(range1, sourceFile), range2.end, sourceFile);
    }
    export function rangeEndIsOnSameLineAsRangeStart(range1: ts.TextRange, range2: ts.TextRange, sourceFile: ts.SourceFile) {
        return positionsAreOnSameLine(range1.end, getStartPositionOfRange(range2, sourceFile), sourceFile);
    }
    export function isNodeArrayMultiLine(list: ts.NodeArray<ts.Node>, sourceFile: ts.SourceFile): boolean {
        return !positionsAreOnSameLine(list.pos, list.end, sourceFile);
    }
    export function positionsAreOnSameLine(pos1: number, pos2: number, sourceFile: ts.SourceFile) {
        return pos1 === pos2 ||
            getLineOfLocalPosition(sourceFile, pos1) === getLineOfLocalPosition(sourceFile, pos2);
    }
    export function getStartPositionOfRange(range: ts.TextRange, sourceFile: ts.SourceFile) {
        return positionIsSynthesized(range.pos) ? -1 : ts.skipTrivia(sourceFile.text, range.pos);
    }
    /**
     * Determines whether a name was originally the declaration name of an enum or namespace
     * declaration.
     */
    export function isDeclarationNameOfEnumOrNamespace(node: ts.Identifier) {
        const parseNode = ts.getParseTreeNode(node);
        if (parseNode) {
            switch (parseNode.parent.kind) {
                case ts.SyntaxKind.EnumDeclaration:
                case ts.SyntaxKind.ModuleDeclaration:
                    return parseNode === (<ts.EnumDeclaration | ts.ModuleDeclaration>parseNode.parent).name;
            }
        }
        return false;
    }
    export function getInitializedVariables(node: ts.VariableDeclarationList) {
        return ts.filter(node.declarations, isInitializedVariable);
    }
    function isInitializedVariable(node: ts.VariableDeclaration) {
        return node.initializer !== undefined;
    }
    export function isWatchSet(options: ts.CompilerOptions) {
        // Firefox has Object.prototype.watch
        return options.watch && options.hasOwnProperty("watch");
    }
    export function closeFileWatcher(watcher: ts.FileWatcher) {
        watcher.close();
    }
    export function getCheckFlags(symbol: ts.Symbol): ts.CheckFlags {
        return symbol.flags & ts.SymbolFlags.Transient ? (<ts.TransientSymbol>symbol).checkFlags : 0;
    }
    export function getDeclarationModifierFlagsFromSymbol(s: ts.Symbol): ts.ModifierFlags {
        if (s.valueDeclaration) {
            const flags = ts.getCombinedModifierFlags(s.valueDeclaration);
            return s.parent && s.parent.flags & ts.SymbolFlags.Class ? flags : flags & ~ts.ModifierFlags.AccessibilityModifier;
        }
        if (getCheckFlags(s) & ts.CheckFlags.Synthetic) {
            const checkFlags = (<ts.TransientSymbol>s).checkFlags;
            const accessModifier = checkFlags & ts.CheckFlags.ContainsPrivate ? ts.ModifierFlags.Private :
                checkFlags & ts.CheckFlags.ContainsPublic ? ts.ModifierFlags.Public :
                    ts.ModifierFlags.Protected;
            const staticModifier = checkFlags & ts.CheckFlags.ContainsStatic ? ts.ModifierFlags.Static : 0;
            return accessModifier | staticModifier;
        }
        if (s.flags & ts.SymbolFlags.Prototype) {
            return ts.ModifierFlags.Public | ts.ModifierFlags.Static;
        }
        return 0;
    }
    export function skipAlias(symbol: ts.Symbol, checker: ts.TypeChecker) {
        return symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
    }
    /** See comment on `declareModuleMember` in `binder.ts`. */
    export function getCombinedLocalAndExportSymbolFlags(symbol: ts.Symbol): ts.SymbolFlags {
        return symbol.exportSymbol ? symbol.exportSymbol.flags | symbol.flags : symbol.flags;
    }
    export function isWriteOnlyAccess(node: ts.Node) {
        return accessKind(node) === AccessKind.Write;
    }
    export function isWriteAccess(node: ts.Node) {
        return accessKind(node) !== AccessKind.Read;
    }
    const enum AccessKind {
        /** Only reads from a variable. */
        Read,
        /** Only writes to a variable without using the result. E.g.: `x++;`. */
        Write,
        /** Writes to a variable and uses the result as an expression. E.g.: `f(x++);`. */
        ReadWrite
    }
    function accessKind(node: ts.Node): AccessKind {
        const { parent } = node;
        if (!parent)
            return AccessKind.Read;
        switch (parent.kind) {
            case ts.SyntaxKind.ParenthesizedExpression:
                return accessKind(parent);
            case ts.SyntaxKind.PostfixUnaryExpression:
            case ts.SyntaxKind.PrefixUnaryExpression:
                const { operator } = (parent as ts.PrefixUnaryExpression | ts.PostfixUnaryExpression);
                return operator === ts.SyntaxKind.PlusPlusToken || operator === ts.SyntaxKind.MinusMinusToken ? writeOrReadWrite() : AccessKind.Read;
            case ts.SyntaxKind.BinaryExpression:
                const { left, operatorToken } = (parent as ts.BinaryExpression);
                return left === node && isAssignmentOperator(operatorToken.kind) ?
                    operatorToken.kind === ts.SyntaxKind.EqualsToken ? AccessKind.Write : writeOrReadWrite()
                    : AccessKind.Read;
            case ts.SyntaxKind.PropertyAccessExpression:
                return (parent as ts.PropertyAccessExpression).name !== node ? AccessKind.Read : accessKind(parent);
            case ts.SyntaxKind.PropertyAssignment: {
                const parentAccess = accessKind(parent.parent);
                // In `({ x: varname }) = { x: 1 }`, the left `x` is a read, the right `x` is a write.
                return node === (parent as ts.PropertyAssignment).name ? reverseAccessKind(parentAccess) : parentAccess;
            }
            case ts.SyntaxKind.ShorthandPropertyAssignment:
                // Assume it's the local variable being accessed, since we don't check public properties for --noUnusedLocals.
                return node === (parent as ts.ShorthandPropertyAssignment).objectAssignmentInitializer ? AccessKind.Read : accessKind(parent.parent);
            case ts.SyntaxKind.ArrayLiteralExpression:
                return accessKind(parent);
            default:
                return AccessKind.Read;
        }
        function writeOrReadWrite(): AccessKind {
            // If grandparent is not an ExpressionStatement, this is used as an expression in addition to having a side effect.
            return parent.parent && skipParenthesesUp(parent.parent).kind === ts.SyntaxKind.ExpressionStatement ? AccessKind.Write : AccessKind.ReadWrite;
        }
    }
    function reverseAccessKind(a: AccessKind): AccessKind {
        switch (a) {
            case AccessKind.Read:
                return AccessKind.Write;
            case AccessKind.Write:
                return AccessKind.Read;
            case AccessKind.ReadWrite:
                return AccessKind.ReadWrite;
            default:
                return ts.Debug.assertNever(a);
        }
    }
    export function compareDataObjects(dst: any, src: any): boolean {
        if (!dst || !src || Object.keys(dst).length !== Object.keys(src).length) {
            return false;
        }
        for (const e in dst) {
            if (typeof dst[e] === "object") {
                if (!compareDataObjects(dst[e], src[e])) {
                    return false;
                }
            }
            else if (typeof dst[e] !== "function") {
                if (dst[e] !== src[e]) {
                    return false;
                }
            }
        }
        return true;
    }
    /**
     * clears already present map by calling onDeleteExistingValue callback before deleting that key/value
     */
    export function clearMap<T>(map: {
        forEach: ts.Map<T>["forEach"];
        clear: ts.Map<T>["clear"];
    }, onDeleteValue: (valueInMap: T, key: string) => void) {
        // Remove all
        map.forEach(onDeleteValue);
        map.clear();
    }
    export interface MutateMapSkippingNewValuesOptions<T, U> {
        onDeleteValue(existingValue: T, key: string): void;
        /**
         * If present this is called with the key when there is value for that key both in new map as well as existing map provided
         * Caller can then decide to update or remove this key.
         * If the key is removed, caller will get callback of createNewValue for that key.
         * If this callback is not provided, the value of such keys is not updated.
         */
        onExistingValue?(existingValue: T, valueInNewMap: U, key: string): void;
    }
    /**
     * Mutates the map with newMap such that keys in map will be same as newMap.
     */
    export function mutateMapSkippingNewValues<T, U>(map: ts.Map<T>, newMap: ts.ReadonlyMap<U>, options: MutateMapSkippingNewValuesOptions<T, U>) {
        const { onDeleteValue, onExistingValue } = options;
        // Needs update
        map.forEach((existingValue, key) => {
            const valueInNewMap = newMap.get(key);
            // Not present any more in new map, remove it
            if (valueInNewMap === undefined) {
                map.delete(key);
                onDeleteValue(existingValue, key);
            }
            // If present notify about existing values
            else if (onExistingValue) {
                onExistingValue(existingValue, valueInNewMap, key);
            }
        });
    }
    export interface MutateMapOptions<T, U> extends MutateMapSkippingNewValuesOptions<T, U> {
        createNewValue(key: string, valueInNewMap: U): T;
    }
    /**
     * Mutates the map with newMap such that keys in map will be same as newMap.
     */
    export function mutateMap<T, U>(map: ts.Map<T>, newMap: ts.ReadonlyMap<U>, options: MutateMapOptions<T, U>) {
        // Needs update
        mutateMapSkippingNewValues(map, newMap, options);
        const { createNewValue } = options;
        // Add new values that are not already present
        newMap.forEach((valueInNewMap, key) => {
            if (!map.has(key)) {
                // New values
                map.set(key, createNewValue(key, valueInNewMap));
            }
        });
    }
    // Return true if the given type is the constructor type for an abstract class
    export function isAbstractConstructorType(type: ts.Type): boolean {
        return !!(getObjectFlags(type) & ts.ObjectFlags.Anonymous) && !!type.symbol && isAbstractConstructorSymbol(type.symbol);
    }
    export function isAbstractConstructorSymbol(symbol: ts.Symbol): boolean {
        if (symbol.flags & ts.SymbolFlags.Class) {
            const declaration = getClassLikeDeclarationOfSymbol(symbol);
            return !!declaration && hasModifier(declaration, ts.ModifierFlags.Abstract);
        }
        return false;
    }
    export function getClassLikeDeclarationOfSymbol(symbol: ts.Symbol): ts.ClassLikeDeclaration | undefined {
        return ts.find(symbol.declarations, ts.isClassLike);
    }
    export function getObjectFlags(type: ts.Type): ts.ObjectFlags {
        return type.flags & ts.TypeFlags.ObjectFlagsType ? (<ts.ObjectFlagsType>type).objectFlags : 0;
    }
    export function typeHasCallOrConstructSignatures(type: ts.Type, checker: ts.TypeChecker) {
        return checker.getSignaturesOfType(type, ts.SignatureKind.Call).length !== 0 || checker.getSignaturesOfType(type, ts.SignatureKind.Construct).length !== 0;
    }
    export function forSomeAncestorDirectory(directory: string, callback: (directory: string) => boolean): boolean {
        return !!ts.forEachAncestorDirectory(directory, d => callback(d) ? true : undefined);
    }
    export function isUMDExportSymbol(symbol: ts.Symbol | undefined): boolean {
        return !!symbol && !!symbol.declarations && !!symbol.declarations[0] && ts.isNamespaceExportDeclaration(symbol.declarations[0]);
    }
    export function showModuleSpecifier({ moduleSpecifier }: ts.ImportDeclaration): string {
        return ts.isStringLiteral(moduleSpecifier) ? moduleSpecifier.text : getTextOfNode(moduleSpecifier);
    }
    export function getLastChild(node: ts.Node): ts.Node | undefined {
        let lastChild: ts.Node | undefined;
        ts.forEachChild(node, child => {
            if (nodeIsPresent(child))
                lastChild = child;
        }, children => {
            // As an optimization, jump straight to the end of the list.
            for (let i = children.length - 1; i >= 0; i--) {
                if (nodeIsPresent(children[i])) {
                    lastChild = children[i];
                    break;
                }
            }
        });
        return lastChild;
    }
    /** Add a value to a set, and return true if it wasn't already present. */
    export function addToSeen(seen: ts.Map<true>, key: string | number): boolean;
    export function addToSeen<T>(seen: ts.Map<T>, key: string | number, value: T): boolean;
    export function addToSeen<T>(seen: ts.Map<T>, key: string | number, value: T = true as any): boolean {
        key = String(key);
        if (seen.has(key)) {
            return false;
        }
        seen.set(key, value);
        return true;
    }
    export function isObjectTypeDeclaration(node: ts.Node): node is ts.ObjectTypeDeclaration {
        return ts.isClassLike(node) || ts.isInterfaceDeclaration(node) || ts.isTypeLiteralNode(node);
    }
    export function isTypeNodeKind(kind: ts.SyntaxKind) {
        return (kind >= ts.SyntaxKind.FirstTypeNode && kind <= ts.SyntaxKind.LastTypeNode)
            || kind === ts.SyntaxKind.AnyKeyword
            || kind === ts.SyntaxKind.UnknownKeyword
            || kind === ts.SyntaxKind.NumberKeyword
            || kind === ts.SyntaxKind.BigIntKeyword
            || kind === ts.SyntaxKind.ObjectKeyword
            || kind === ts.SyntaxKind.BooleanKeyword
            || kind === ts.SyntaxKind.StringKeyword
            || kind === ts.SyntaxKind.SymbolKeyword
            || kind === ts.SyntaxKind.ThisKeyword
            || kind === ts.SyntaxKind.VoidKeyword
            || kind === ts.SyntaxKind.UndefinedKeyword
            || kind === ts.SyntaxKind.NullKeyword
            || kind === ts.SyntaxKind.NeverKeyword
            || kind === ts.SyntaxKind.ExpressionWithTypeArguments
            || kind === ts.SyntaxKind.JSDocAllType
            || kind === ts.SyntaxKind.JSDocUnknownType
            || kind === ts.SyntaxKind.JSDocNullableType
            || kind === ts.SyntaxKind.JSDocNonNullableType
            || kind === ts.SyntaxKind.JSDocOptionalType
            || kind === ts.SyntaxKind.JSDocFunctionType
            || kind === ts.SyntaxKind.JSDocVariadicType;
    }
    export function isAccessExpression(node: ts.Node): node is ts.AccessExpression {
        return node.kind === ts.SyntaxKind.PropertyAccessExpression || node.kind === ts.SyntaxKind.ElementAccessExpression;
    }
    export function isBundleFileTextLike(section: ts.BundleFileSection): section is ts.BundleFileTextLike {
        switch (section.kind) {
            case ts.BundleFileSectionKind.Text:
            case ts.BundleFileSectionKind.Internal:
                return true;
            default:
                return false;
        }
    }
    export function getDotOrQuestionDotToken(node: ts.PropertyAccessExpression) {
        return node.questionDotToken || (ts.createNode(ts.SyntaxKind.DotToken, node.expression.end, node.name.pos) as ts.DotToken);
    }
    export function isNamedImportsOrExports(node: ts.Node): node is ts.NamedImportsOrExports {
        return node.kind === ts.SyntaxKind.NamedImports || node.kind === ts.SyntaxKind.NamedExports;
    }
    export interface ObjectAllocator {
        getNodeConstructor(): new (kind: ts.SyntaxKind, pos?: number, end?: number) => ts.Node;
        getTokenConstructor(): new <TKind extends ts.SyntaxKind>(kind: TKind, pos?: number, end?: number) => ts.Token<TKind>;
        getIdentifierConstructor(): new (kind: ts.SyntaxKind.Identifier, pos?: number, end?: number) => ts.Identifier;
        getSourceFileConstructor(): new (kind: ts.SyntaxKind.SourceFile, pos?: number, end?: number) => ts.SourceFile;
        getSymbolConstructor(): new (flags: ts.SymbolFlags, name: ts.__String) => ts.Symbol;
        getTypeConstructor(): new (checker: ts.TypeChecker, flags: ts.TypeFlags) => ts.Type;
        getSignatureConstructor(): new (checker: ts.TypeChecker, flags: ts.SignatureFlags) => ts.Signature;
        getSourceMapSourceConstructor(): new (fileName: string, text: string, skipTrivia?: (pos: number) => number) => ts.SourceMapSource;
    }
    function Symbol(this: ts.Symbol, flags: ts.SymbolFlags, name: ts.__String) {
        this.flags = flags;
        this.escapedName = name;
        this.declarations = undefined!;
        this.valueDeclaration = undefined!;
        this.id = undefined;
        this.mergeId = undefined;
        this.parent = undefined;
    }
    function Type(this: ts.Type, checker: ts.TypeChecker, flags: ts.TypeFlags) {
        this.flags = flags;
        if (ts.Debug.isDebugging) {
            this.checker = checker;
        }
    }
    function Signature(this: ts.Signature, checker: ts.TypeChecker, flags: ts.SignatureFlags) {
        this.flags = flags;
        if (ts.Debug.isDebugging) {
            this.checker = checker;
        }
    }
    function Node(this: ts.Node, kind: ts.SyntaxKind, pos: number, end: number) {
        this.pos = pos;
        this.end = end;
        this.kind = kind;
        this.id = 0;
        this.flags = ts.NodeFlags.None;
        this.modifierFlagsCache = ts.ModifierFlags.None;
        this.transformFlags = ts.TransformFlags.None;
        this.parent = undefined!;
        this.original = undefined;
    }
    function SourceMapSource(this: ts.SourceMapSource, fileName: string, text: string, skipTrivia?: (pos: number) => number) {
        this.fileName = fileName;
        this.text = text;
        this.skipTrivia = skipTrivia || (pos => pos);
    }
    // eslint-disable-next-line prefer-const
    export let objectAllocator: ObjectAllocator = {
        getNodeConstructor: () => <any>Node,
        getTokenConstructor: () => <any>Node,
        getIdentifierConstructor: () => <any>Node,
        getSourceFileConstructor: () => <any>Node,
        getSymbolConstructor: () => <any>Symbol,
        getTypeConstructor: () => <any>Type,
        getSignatureConstructor: () => <any>Signature,
        getSourceMapSourceConstructor: () => <any>SourceMapSource,
    };
    export function setObjectAllocator(alloc: ObjectAllocator) {
        objectAllocator = alloc;
    }
    export function formatStringFromArgs(text: string, args: ArrayLike<string | number>, baseIndex = 0): string {
        return text.replace(/{(\d+)}/g, (_match, index: string) => "" + ts.Debug.assertDefined(args[+index + baseIndex]));
    }
    export let localizedDiagnosticMessages: ts.MapLike<string> | undefined;
    /* @internal */
    export function setLocalizedDiagnosticMessages(messages: typeof localizedDiagnosticMessages) {
        localizedDiagnosticMessages = messages;
    }
    export function getLocaleSpecificMessage(message: ts.DiagnosticMessage) {
        return localizedDiagnosticMessages && localizedDiagnosticMessages[message.key] || message.message;
    }
    export function createFileDiagnostic(file: ts.SourceFile, start: number, length: number, message: ts.DiagnosticMessage, ...args: (string | number | undefined)[]): ts.DiagnosticWithLocation;
    export function createFileDiagnostic(file: ts.SourceFile, start: number, length: number, message: ts.DiagnosticMessage): ts.DiagnosticWithLocation {
        ts.Debug.assertGreaterThanOrEqual(start, 0);
        ts.Debug.assertGreaterThanOrEqual(length, 0);
        if (file) {
            ts.Debug.assertLessThanOrEqual(start, file.text.length);
            ts.Debug.assertLessThanOrEqual(start + length, file.text.length);
        }
        let text = getLocaleSpecificMessage(message);
        if (arguments.length > 4) {
            text = formatStringFromArgs(text, arguments, 4);
        }
        return {
            file,
            start,
            length,
            messageText: text,
            category: message.category,
            code: message.code,
            reportsUnnecessary: message.reportsUnnecessary,
        };
    }
    export function formatMessage(_dummy: any, message: ts.DiagnosticMessage, ...args: (string | number | undefined)[]): string;
    export function formatMessage(_dummy: any, message: ts.DiagnosticMessage): string {
        let text = getLocaleSpecificMessage(message);
        if (arguments.length > 2) {
            text = formatStringFromArgs(text, arguments, 2);
        }
        return text;
    }
    export function createCompilerDiagnostic(message: ts.DiagnosticMessage, ...args: (string | number | undefined)[]): ts.Diagnostic;
    export function createCompilerDiagnostic(message: ts.DiagnosticMessage): ts.Diagnostic {
        let text = getLocaleSpecificMessage(message);
        if (arguments.length > 1) {
            text = formatStringFromArgs(text, arguments, 1);
        }
        return {
            file: undefined,
            start: undefined,
            length: undefined,
            messageText: text,
            category: message.category,
            code: message.code,
            reportsUnnecessary: message.reportsUnnecessary,
        };
    }
    export function createCompilerDiagnosticFromMessageChain(chain: ts.DiagnosticMessageChain): ts.Diagnostic {
        return {
            file: undefined,
            start: undefined,
            length: undefined,
            code: chain.code,
            category: chain.category,
            messageText: chain.next ? chain : chain.messageText,
        };
    }
    export function chainDiagnosticMessages(details: ts.DiagnosticMessageChain | ts.DiagnosticMessageChain[] | undefined, message: ts.DiagnosticMessage, ...args: (string | number | undefined)[]): ts.DiagnosticMessageChain;
    export function chainDiagnosticMessages(details: ts.DiagnosticMessageChain | ts.DiagnosticMessageChain[] | undefined, message: ts.DiagnosticMessage): ts.DiagnosticMessageChain {
        let text = getLocaleSpecificMessage(message);
        if (arguments.length > 2) {
            text = formatStringFromArgs(text, arguments, 2);
        }
        return {
            messageText: text,
            category: message.category,
            code: message.code,
            next: details === undefined || Array.isArray(details) ? details : [details]
        };
    }
    export function concatenateDiagnosticMessageChains(headChain: ts.DiagnosticMessageChain, tailChain: ts.DiagnosticMessageChain): void {
        let lastChain = headChain;
        while (lastChain.next) {
            lastChain = lastChain.next[0];
        }
        lastChain.next = [tailChain];
    }
    function getDiagnosticFilePath(diagnostic: ts.Diagnostic): string | undefined {
        return diagnostic.file ? diagnostic.file.path : undefined;
    }
    export function compareDiagnostics(d1: ts.Diagnostic, d2: ts.Diagnostic): ts.Comparison {
        return compareDiagnosticsSkipRelatedInformation(d1, d2) ||
            compareRelatedInformation(d1, d2) ||
            ts.Comparison.EqualTo;
    }
    export function compareDiagnosticsSkipRelatedInformation(d1: ts.Diagnostic, d2: ts.Diagnostic): ts.Comparison {
        return ts.compareStringsCaseSensitive(getDiagnosticFilePath(d1), getDiagnosticFilePath(d2)) ||
            ts.compareValues(d1.start, d2.start) ||
            ts.compareValues(d1.length, d2.length) ||
            ts.compareValues(d1.code, d2.code) ||
            compareMessageText(d1.messageText, d2.messageText) ||
            ts.Comparison.EqualTo;
    }
    function compareRelatedInformation(d1: ts.Diagnostic, d2: ts.Diagnostic): ts.Comparison {
        if (!d1.relatedInformation && !d2.relatedInformation) {
            return ts.Comparison.EqualTo;
        }
        if (d1.relatedInformation && d2.relatedInformation) {
            return ts.compareValues(d1.relatedInformation.length, d2.relatedInformation.length) || ts.forEach(d1.relatedInformation, (d1i, index) => {
                const d2i = d2.relatedInformation![index];
                return compareDiagnostics(d1i, d2i); // EqualTo is 0, so falsy, and will cause the next item to be compared
            }) || ts.Comparison.EqualTo;
        }
        return d1.relatedInformation ? ts.Comparison.LessThan : ts.Comparison.GreaterThan;
    }
    function compareMessageText(t1: string | ts.DiagnosticMessageChain, t2: string | ts.DiagnosticMessageChain): ts.Comparison {
        if (typeof t1 === "string" && typeof t2 === "string") {
            return ts.compareStringsCaseSensitive(t1, t2);
        }
        else if (typeof t1 === "string") {
            return ts.Comparison.LessThan;
        }
        else if (typeof t2 === "string") {
            return ts.Comparison.GreaterThan;
        }
        let res = ts.compareStringsCaseSensitive(t1.messageText, t2.messageText);
        if (res) {
            return res;
        }
        if (!t1.next && !t2.next) {
            return ts.Comparison.EqualTo;
        }
        if (!t1.next) {
            return ts.Comparison.LessThan;
        }
        if (!t2.next) {
            return ts.Comparison.GreaterThan;
        }
        const len = Math.min(t1.next.length, t2.next.length);
        for (let i = 0; i < len; i++) {
            res = compareMessageText(t1.next[i], t2.next[i]);
            if (res) {
                return res;
            }
        }
        if (t1.next.length < t2.next.length) {
            return ts.Comparison.LessThan;
        }
        else if (t1.next.length > t2.next.length) {
            return ts.Comparison.GreaterThan;
        }
        return ts.Comparison.EqualTo;
    }
    export function getEmitScriptTarget(compilerOptions: ts.CompilerOptions) {
        return compilerOptions.target || ts.ScriptTarget.ES3;
    }
    export function getEmitModuleKind(compilerOptions: {
        module?: ts.CompilerOptions["module"];
        target?: ts.CompilerOptions["target"];
    }) {
        return typeof compilerOptions.module === "number" ?
            compilerOptions.module :
            getEmitScriptTarget(compilerOptions) >= ts.ScriptTarget.ES2015 ? ts.ModuleKind.ES2015 : ts.ModuleKind.CommonJS;
    }
    export function getEmitModuleResolutionKind(compilerOptions: ts.CompilerOptions) {
        let moduleResolution = compilerOptions.moduleResolution;
        if (moduleResolution === undefined) {
            moduleResolution = getEmitModuleKind(compilerOptions) === ts.ModuleKind.CommonJS ? ts.ModuleResolutionKind.NodeJs : ts.ModuleResolutionKind.Classic;
        }
        return moduleResolution;
    }
    export function hasJsonModuleEmitEnabled(options: ts.CompilerOptions) {
        switch (getEmitModuleKind(options)) {
            case ts.ModuleKind.CommonJS:
            case ts.ModuleKind.AMD:
            case ts.ModuleKind.ES2015:
            case ts.ModuleKind.ESNext:
                return true;
            default:
                return false;
        }
    }
    export function unreachableCodeIsError(options: ts.CompilerOptions): boolean {
        return options.allowUnreachableCode === false;
    }
    export function unusedLabelIsError(options: ts.CompilerOptions): boolean {
        return options.allowUnusedLabels === false;
    }
    export function getAreDeclarationMapsEnabled(options: ts.CompilerOptions) {
        return !!(getEmitDeclarations(options) && options.declarationMap);
    }
    export function getAllowSyntheticDefaultImports(compilerOptions: ts.CompilerOptions) {
        const moduleKind = getEmitModuleKind(compilerOptions);
        return compilerOptions.allowSyntheticDefaultImports !== undefined
            ? compilerOptions.allowSyntheticDefaultImports
            : compilerOptions.esModuleInterop ||
                moduleKind === ts.ModuleKind.System;
    }
    export function getEmitDeclarations(compilerOptions: ts.CompilerOptions): boolean {
        return !!(compilerOptions.declaration || compilerOptions.composite);
    }
    export function isIncrementalCompilation(options: ts.CompilerOptions) {
        return !!(options.incremental || options.composite);
    }
    export type StrictOptionName = "noImplicitAny" | "noImplicitThis" | "strictNullChecks" | "strictFunctionTypes" | "strictBindCallApply" | "strictPropertyInitialization" | "alwaysStrict";
    export function getStrictOptionValue(compilerOptions: ts.CompilerOptions, flag: StrictOptionName): boolean {
        return compilerOptions[flag] === undefined ? !!compilerOptions.strict : !!compilerOptions[flag];
    }
    export function compilerOptionsAffectSemanticDiagnostics(newOptions: ts.CompilerOptions, oldOptions: ts.CompilerOptions): boolean {
        return oldOptions !== newOptions &&
            ts.semanticDiagnosticsOptionDeclarations.some(option => !isJsonEqual(getCompilerOptionValue(oldOptions, option), getCompilerOptionValue(newOptions, option)));
    }
    export function compilerOptionsAffectEmit(newOptions: ts.CompilerOptions, oldOptions: ts.CompilerOptions): boolean {
        return oldOptions !== newOptions &&
            ts.affectsEmitOptionDeclarations.some(option => !isJsonEqual(getCompilerOptionValue(oldOptions, option), getCompilerOptionValue(newOptions, option)));
    }
    export function getCompilerOptionValue(options: ts.CompilerOptions, option: ts.CommandLineOption): unknown {
        return option.strictFlag ? getStrictOptionValue(options, option.name as StrictOptionName) : options[option.name];
    }
    export function hasZeroOrOneAsteriskCharacter(str: string): boolean {
        let seenAsterisk = false;
        for (let i = 0; i < str.length; i++) {
            if (str.charCodeAt(i) === ts.CharacterCodes.asterisk) {
                if (!seenAsterisk) {
                    seenAsterisk = true;
                }
                else {
                    // have already seen asterisk
                    return false;
                }
            }
        }
        return true;
    }
    export function discoverProbableSymlinks(files: readonly ts.SourceFile[], getCanonicalFileName: ts.GetCanonicalFileName, cwd: string): ts.ReadonlyMap<string> {
        const result = ts.createMap<string>();
        const symlinks = ts.flatten<readonly [string, string]>(ts.mapDefined(files, sf => sf.resolvedModules && ts.compact(ts.arrayFrom(ts.mapIterator(sf.resolvedModules.values(), res => res && res.originalPath && res.resolvedFileName !== res.originalPath ? [res.resolvedFileName, res.originalPath] as const : undefined)))));
        for (const [resolvedPath, originalPath] of symlinks) {
            const [commonResolved, commonOriginal] = guessDirectorySymlink(resolvedPath, originalPath, cwd, getCanonicalFileName);
            result.set(commonOriginal, commonResolved);
        }
        return result;
    }
    function guessDirectorySymlink(a: string, b: string, cwd: string, getCanonicalFileName: ts.GetCanonicalFileName): [string, string] {
        const aParts = ts.getPathComponents(ts.toPath(a, cwd, getCanonicalFileName));
        const bParts = ts.getPathComponents(ts.toPath(b, cwd, getCanonicalFileName));
        while (!isNodeModulesOrScopedPackageDirectory(aParts[aParts.length - 2], getCanonicalFileName) &&
            !isNodeModulesOrScopedPackageDirectory(bParts[bParts.length - 2], getCanonicalFileName) &&
            getCanonicalFileName(aParts[aParts.length - 1]) === getCanonicalFileName(bParts[bParts.length - 1])) {
            aParts.pop();
            bParts.pop();
        }
        return [ts.getPathFromPathComponents(aParts), ts.getPathFromPathComponents(bParts)];
    }
    // KLUDGE: Don't assume one 'node_modules' links to another. More likely a single directory inside the node_modules is the symlink.
    // ALso, don't assume that an `@foo` directory is linked. More likely the contents of that are linked.
    function isNodeModulesOrScopedPackageDirectory(s: string, getCanonicalFileName: ts.GetCanonicalFileName): boolean {
        return getCanonicalFileName(s) === "node_modules" || ts.startsWith(s, "@");
    }
    function stripLeadingDirectorySeparator(s: string): string | undefined {
        return ts.isAnyDirectorySeparator(s.charCodeAt(0)) ? s.slice(1) : undefined;
    }
    export function tryRemoveDirectoryPrefix(path: string, dirPath: string, getCanonicalFileName: ts.GetCanonicalFileName): string | undefined {
        const withoutPrefix = ts.tryRemovePrefix(path, dirPath, getCanonicalFileName);
        return withoutPrefix === undefined ? undefined : stripLeadingDirectorySeparator(withoutPrefix);
    }
    // Reserved characters, forces escaping of any non-word (or digit), non-whitespace character.
    // It may be inefficient (we could just match (/[-[\]{}()*+?.,\\^$|#\s]/g), but this is future
    // proof.
    const reservedCharacterPattern = /[^\w\s\/]/g;
    export function regExpEscape(text: string) {
        return text.replace(reservedCharacterPattern, escapeRegExpCharacter);
    }
    function escapeRegExpCharacter(match: string) {
        return "\\" + match;
    }
    const wildcardCharCodes = [ts.CharacterCodes.asterisk, ts.CharacterCodes.question];
    export const commonPackageFolders: readonly string[] = ["node_modules", "bower_components", "jspm_packages"];
    const implicitExcludePathRegexPattern = `(?!(${commonPackageFolders.join("|")})(/|$))`;
    interface WildcardMatcher {
        singleAsteriskRegexFragment: string;
        doubleAsteriskRegexFragment: string;
        replaceWildcardCharacter: (match: string) => string;
    }
    const filesMatcher: WildcardMatcher = {
        /**
         * Matches any single directory segment unless it is the last segment and a .min.js file
         * Breakdown:
         *  [^./]                   # matches everything up to the first . character (excluding directory separators)
         *  (\\.(?!min\\.js$))?     # matches . characters but not if they are part of the .min.js file extension
         */
        singleAsteriskRegexFragment: "([^./]|(\\.(?!min\\.js$))?)*",
        /**
         * Regex for the ** wildcard. Matches any number of subdirectories. When used for including
         * files or directories, does not match subdirectories that start with a . character
         */
        doubleAsteriskRegexFragment: `(/${implicitExcludePathRegexPattern}[^/.][^/]*)*?`,
        replaceWildcardCharacter: match => replaceWildcardCharacter(match, filesMatcher.singleAsteriskRegexFragment)
    };
    const directoriesMatcher: WildcardMatcher = {
        singleAsteriskRegexFragment: "[^/]*",
        /**
         * Regex for the ** wildcard. Matches any number of subdirectories. When used for including
         * files or directories, does not match subdirectories that start with a . character
         */
        doubleAsteriskRegexFragment: `(/${implicitExcludePathRegexPattern}[^/.][^/]*)*?`,
        replaceWildcardCharacter: match => replaceWildcardCharacter(match, directoriesMatcher.singleAsteriskRegexFragment)
    };
    const excludeMatcher: WildcardMatcher = {
        singleAsteriskRegexFragment: "[^/]*",
        doubleAsteriskRegexFragment: "(/.+?)?",
        replaceWildcardCharacter: match => replaceWildcardCharacter(match, excludeMatcher.singleAsteriskRegexFragment)
    };
    const wildcardMatchers = {
        files: filesMatcher,
        directories: directoriesMatcher,
        exclude: excludeMatcher
    };
    export function getRegularExpressionForWildcard(specs: readonly string[] | undefined, basePath: string, usage: "files" | "directories" | "exclude"): string | undefined {
        const patterns = getRegularExpressionsForWildcards(specs, basePath, usage);
        if (!patterns || !patterns.length) {
            return undefined;
        }
        const pattern = patterns.map(pattern => `(${pattern})`).join("|");
        // If excluding, match "foo/bar/baz...", but if including, only allow "foo".
        const terminator = usage === "exclude" ? "($|/)" : "$";
        return `^(${pattern})${terminator}`;
    }
    export function getRegularExpressionsForWildcards(specs: readonly string[] | undefined, basePath: string, usage: "files" | "directories" | "exclude"): readonly string[] | undefined {
        if (specs === undefined || specs.length === 0) {
            return undefined;
        }
        return ts.flatMap(specs, spec => spec && getSubPatternFromSpec(spec, basePath, usage, wildcardMatchers[usage]));
    }
    /**
     * An "includes" path "foo" is implicitly a glob "foo/** /*" (without the space) if its last component has no extension,
     * and does not contain any glob characters itself.
     */
    export function isImplicitGlob(lastPathComponent: string): boolean {
        return !/[.*?]/.test(lastPathComponent);
    }
    function getSubPatternFromSpec(spec: string, basePath: string, usage: "files" | "directories" | "exclude", { singleAsteriskRegexFragment, doubleAsteriskRegexFragment, replaceWildcardCharacter }: WildcardMatcher): string | undefined {
        let subpattern = "";
        let hasWrittenComponent = false;
        const components = ts.getNormalizedPathComponents(spec, basePath);
        const lastComponent = ts.last(components);
        if (usage !== "exclude" && lastComponent === "**") {
            return undefined;
        }
        // getNormalizedPathComponents includes the separator for the root component.
        // We need to remove to create our regex correctly.
        components[0] = ts.removeTrailingDirectorySeparator(components[0]);
        if (isImplicitGlob(lastComponent)) {
            components.push("**", "*");
        }
        let optionalCount = 0;
        for (let component of components) {
            if (component === "**") {
                subpattern += doubleAsteriskRegexFragment;
            }
            else {
                if (usage === "directories") {
                    subpattern += "(";
                    optionalCount++;
                }
                if (hasWrittenComponent) {
                    subpattern += ts.directorySeparator;
                }
                if (usage !== "exclude") {
                    let componentPattern = "";
                    // The * and ? wildcards should not match directories or files that start with . if they
                    // appear first in a component. Dotted directories and files can be included explicitly
                    // like so: **/.*/.*
                    if (component.charCodeAt(0) === ts.CharacterCodes.asterisk) {
                        componentPattern += "([^./]" + singleAsteriskRegexFragment + ")?";
                        component = component.substr(1);
                    }
                    else if (component.charCodeAt(0) === ts.CharacterCodes.question) {
                        componentPattern += "[^./]";
                        component = component.substr(1);
                    }
                    componentPattern += component.replace(reservedCharacterPattern, replaceWildcardCharacter);
                    // Patterns should not include subfolders like node_modules unless they are
                    // explicitly included as part of the path.
                    //
                    // As an optimization, if the component pattern is the same as the component,
                    // then there definitely were no wildcard characters and we do not need to
                    // add the exclusion pattern.
                    if (componentPattern !== component) {
                        subpattern += implicitExcludePathRegexPattern;
                    }
                    subpattern += componentPattern;
                }
                else {
                    subpattern += component.replace(reservedCharacterPattern, replaceWildcardCharacter);
                }
            }
            hasWrittenComponent = true;
        }
        while (optionalCount > 0) {
            subpattern += ")?";
            optionalCount--;
        }
        return subpattern;
    }
    function replaceWildcardCharacter(match: string, singleAsteriskRegexFragment: string) {
        return match === "*" ? singleAsteriskRegexFragment : match === "?" ? "[^/]" : "\\" + match;
    }
    export interface FileSystemEntries {
        readonly files: readonly string[];
        readonly directories: readonly string[];
    }
    export interface FileMatcherPatterns {
        /** One pattern for each "include" spec. */
        includeFilePatterns: readonly string[] | undefined;
        /** One pattern matching one of any of the "include" specs. */
        includeFilePattern: string | undefined;
        includeDirectoryPattern: string | undefined;
        excludePattern: string | undefined;
        basePaths: readonly string[];
    }
    /** @param path directory of the tsconfig.json */
    export function getFileMatcherPatterns(path: string, excludes: readonly string[] | undefined, includes: readonly string[] | undefined, useCaseSensitiveFileNames: boolean, currentDirectory: string): FileMatcherPatterns {
        path = ts.normalizePath(path);
        currentDirectory = ts.normalizePath(currentDirectory);
        const absolutePath = ts.combinePaths(currentDirectory, path);
        return {
            includeFilePatterns: ts.map(getRegularExpressionsForWildcards(includes, absolutePath, "files"), pattern => `^${pattern}$`),
            includeFilePattern: getRegularExpressionForWildcard(includes, absolutePath, "files"),
            includeDirectoryPattern: getRegularExpressionForWildcard(includes, absolutePath, "directories"),
            excludePattern: getRegularExpressionForWildcard(excludes, absolutePath, "exclude"),
            basePaths: getBasePaths(path, includes, useCaseSensitiveFileNames)
        };
    }
    export function getRegexFromPattern(pattern: string, useCaseSensitiveFileNames: boolean): RegExp {
        return new RegExp(pattern, useCaseSensitiveFileNames ? "" : "i");
    }
    /** @param path directory of the tsconfig.json */
    export function matchFiles(path: string, extensions: readonly string[] | undefined, excludes: readonly string[] | undefined, includes: readonly string[] | undefined, useCaseSensitiveFileNames: boolean, currentDirectory: string, depth: number | undefined, getFileSystemEntries: (path: string) => FileSystemEntries, realpath: (path: string) => string): string[] {
        path = ts.normalizePath(path);
        currentDirectory = ts.normalizePath(currentDirectory);
        const patterns = getFileMatcherPatterns(path, excludes, includes, useCaseSensitiveFileNames, currentDirectory);
        const includeFileRegexes = patterns.includeFilePatterns && patterns.includeFilePatterns.map(pattern => getRegexFromPattern(pattern, useCaseSensitiveFileNames));
        const includeDirectoryRegex = patterns.includeDirectoryPattern && getRegexFromPattern(patterns.includeDirectoryPattern, useCaseSensitiveFileNames);
        const excludeRegex = patterns.excludePattern && getRegexFromPattern(patterns.excludePattern, useCaseSensitiveFileNames);
        // Associate an array of results with each include regex. This keeps results in order of the "include" order.
        // If there are no "includes", then just put everything in results[0].
        const results: string[][] = includeFileRegexes ? includeFileRegexes.map(() => []) : [[]];
        const visited = ts.createMap<true>();
        const toCanonical = ts.createGetCanonicalFileName(useCaseSensitiveFileNames);
        for (const basePath of patterns.basePaths) {
            visitDirectory(basePath, ts.combinePaths(currentDirectory, basePath), depth);
        }
        return ts.flatten(results);
        function visitDirectory(path: string, absolutePath: string, depth: number | undefined) {
            const canonicalPath = toCanonical(realpath(absolutePath));
            if (visited.has(canonicalPath))
                return;
            visited.set(canonicalPath, true);
            const { files, directories } = getFileSystemEntries(path);
            for (const current of ts.sort<string>(files, ts.compareStringsCaseSensitive)) {
                const name = ts.combinePaths(path, current);
                const absoluteName = ts.combinePaths(absolutePath, current);
                if (extensions && !ts.fileExtensionIsOneOf(name, extensions))
                    continue;
                if (excludeRegex && excludeRegex.test(absoluteName))
                    continue;
                if (!includeFileRegexes) {
                    results[0].push(name);
                }
                else {
                    const includeIndex = ts.findIndex(includeFileRegexes, re => re.test(absoluteName));
                    if (includeIndex !== -1) {
                        results[includeIndex].push(name);
                    }
                }
            }
            if (depth !== undefined) {
                depth--;
                if (depth === 0) {
                    return;
                }
            }
            for (const current of ts.sort<string>(directories, ts.compareStringsCaseSensitive)) {
                const name = ts.combinePaths(path, current);
                const absoluteName = ts.combinePaths(absolutePath, current);
                if ((!includeDirectoryRegex || includeDirectoryRegex.test(absoluteName)) &&
                    (!excludeRegex || !excludeRegex.test(absoluteName))) {
                    visitDirectory(name, absoluteName, depth);
                }
            }
        }
    }
    /**
     * Computes the unique non-wildcard base paths amongst the provided include patterns.
     */
    function getBasePaths(path: string, includes: readonly string[] | undefined, useCaseSensitiveFileNames: boolean): string[] {
        // Storage for our results in the form of literal paths (e.g. the paths as written by the user).
        const basePaths: string[] = [path];
        if (includes) {
            // Storage for literal base paths amongst the include patterns.
            const includeBasePaths: string[] = [];
            for (const include of includes) {
                // We also need to check the relative paths by converting them to absolute and normalizing
                // in case they escape the base path (e.g "..\somedirectory")
                const absolute: string = ts.isRootedDiskPath(include) ? include : ts.normalizePath(ts.combinePaths(path, include));
                // Append the literal and canonical candidate base paths.
                includeBasePaths.push(getIncludeBasePath(absolute));
            }
            // Sort the offsets array using either the literal or canonical path representations.
            includeBasePaths.sort(ts.getStringComparer(!useCaseSensitiveFileNames));
            // Iterate over each include base path and include unique base paths that are not a
            // subpath of an existing base path
            for (const includeBasePath of includeBasePaths) {
                if (ts.every(basePaths, basePath => !ts.containsPath(basePath, includeBasePath, path, !useCaseSensitiveFileNames))) {
                    basePaths.push(includeBasePath);
                }
            }
        }
        return basePaths;
    }
    function getIncludeBasePath(absolute: string): string {
        const wildcardOffset = ts.indexOfAnyCharCode(absolute, wildcardCharCodes);
        if (wildcardOffset < 0) {
            // No "*" or "?" in the path
            return !ts.hasExtension(absolute)
                ? absolute
                : ts.removeTrailingDirectorySeparator(ts.getDirectoryPath(absolute));
        }
        return absolute.substring(0, absolute.lastIndexOf(ts.directorySeparator, wildcardOffset));
    }
    export function ensureScriptKind(fileName: string, scriptKind: ts.ScriptKind | undefined): ts.ScriptKind {
        // Using scriptKind as a condition handles both:
        // - 'scriptKind' is unspecified and thus it is `undefined`
        // - 'scriptKind' is set and it is `Unknown` (0)
        // If the 'scriptKind' is 'undefined' or 'Unknown' then we attempt
        // to get the ScriptKind from the file name. If it cannot be resolved
        // from the file name then the default 'TS' script kind is returned.
        return scriptKind || getScriptKindFromFileName(fileName) || ts.ScriptKind.TS;
    }
    export function getScriptKindFromFileName(fileName: string): ts.ScriptKind {
        const ext = fileName.substr(fileName.lastIndexOf("."));
        switch (ext.toLowerCase()) {
            case ts.Extension.Js:
                return ts.ScriptKind.JS;
            case ts.Extension.Jsx:
                return ts.ScriptKind.JSX;
            case ts.Extension.Ts:
                return ts.ScriptKind.TS;
            case ts.Extension.Tsx:
                return ts.ScriptKind.TSX;
            case ts.Extension.Json:
                return ts.ScriptKind.JSON;
            default:
                return ts.ScriptKind.Unknown;
        }
    }
    /**
     *  List of supported extensions in order of file resolution precedence.
     */
    export const supportedTSExtensions: readonly ts.Extension[] = [ts.Extension.Ts, ts.Extension.Tsx, ts.Extension.Dts];
    export const supportedTSExtensionsWithJson: readonly ts.Extension[] = [ts.Extension.Ts, ts.Extension.Tsx, ts.Extension.Dts, ts.Extension.Json];
    /** Must have ".d.ts" first because if ".ts" goes first, that will be detected as the extension instead of ".d.ts". */
    export const supportedTSExtensionsForExtractExtension: readonly ts.Extension[] = [ts.Extension.Dts, ts.Extension.Ts, ts.Extension.Tsx];
    export const supportedJSExtensions: readonly ts.Extension[] = [ts.Extension.Js, ts.Extension.Jsx];
    export const supportedJSAndJsonExtensions: readonly ts.Extension[] = [ts.Extension.Js, ts.Extension.Jsx, ts.Extension.Json];
    const allSupportedExtensions: readonly ts.Extension[] = [...supportedTSExtensions, ...supportedJSExtensions];
    const allSupportedExtensionsWithJson: readonly ts.Extension[] = [...supportedTSExtensions, ...supportedJSExtensions, ts.Extension.Json];
    export function getSupportedExtensions(options?: ts.CompilerOptions): readonly ts.Extension[];
    export function getSupportedExtensions(options?: ts.CompilerOptions, extraFileExtensions?: readonly ts.FileExtensionInfo[]): readonly string[];
    export function getSupportedExtensions(options?: ts.CompilerOptions, extraFileExtensions?: readonly ts.FileExtensionInfo[]): readonly string[] {
        const needJsExtensions = options && options.allowJs;
        if (!extraFileExtensions || extraFileExtensions.length === 0) {
            return needJsExtensions ? allSupportedExtensions : supportedTSExtensions;
        }
        const extensions = [
            ...needJsExtensions ? allSupportedExtensions : supportedTSExtensions,
            ...ts.mapDefined(extraFileExtensions, x => x.scriptKind === ts.ScriptKind.Deferred || needJsExtensions && isJSLike(x.scriptKind) ? x.extension : undefined)
        ];
        return ts.deduplicate<string>(extensions, ts.equateStringsCaseSensitive, ts.compareStringsCaseSensitive);
    }
    export function getSuppoertedExtensionsWithJsonIfResolveJsonModule(options: ts.CompilerOptions | undefined, supportedExtensions: readonly string[]): readonly string[] {
        if (!options || !options.resolveJsonModule) {
            return supportedExtensions;
        }
        if (supportedExtensions === allSupportedExtensions) {
            return allSupportedExtensionsWithJson;
        }
        if (supportedExtensions === supportedTSExtensions) {
            return supportedTSExtensionsWithJson;
        }
        return [...supportedExtensions, ts.Extension.Json];
    }
    function isJSLike(scriptKind: ts.ScriptKind | undefined): boolean {
        return scriptKind === ts.ScriptKind.JS || scriptKind === ts.ScriptKind.JSX;
    }
    export function hasJSFileExtension(fileName: string): boolean {
        return ts.some(supportedJSExtensions, extension => ts.fileExtensionIs(fileName, extension));
    }
    export function hasTSFileExtension(fileName: string): boolean {
        return ts.some(supportedTSExtensions, extension => ts.fileExtensionIs(fileName, extension));
    }
    export function isSupportedSourceFileName(fileName: string, compilerOptions?: ts.CompilerOptions, extraFileExtensions?: readonly ts.FileExtensionInfo[]) {
        if (!fileName) {
            return false;
        }
        const supportedExtensions = getSupportedExtensions(compilerOptions, extraFileExtensions);
        for (const extension of getSuppoertedExtensionsWithJsonIfResolveJsonModule(compilerOptions, supportedExtensions)) {
            if (ts.fileExtensionIs(fileName, extension)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Extension boundaries by priority. Lower numbers indicate higher priorities, and are
     * aligned to the offset of the highest priority extension in the
     * allSupportedExtensions array.
     */
    export const enum ExtensionPriority {
        TypeScriptFiles = 0,
        DeclarationAndJavaScriptFiles = 2,
        Highest = TypeScriptFiles,
        Lowest = DeclarationAndJavaScriptFiles
    }
    export function getExtensionPriority(path: string, supportedExtensions: readonly string[]): ExtensionPriority {
        for (let i = supportedExtensions.length - 1; i >= 0; i--) {
            if (ts.fileExtensionIs(path, supportedExtensions[i])) {
                return adjustExtensionPriority(<ExtensionPriority>i, supportedExtensions);
            }
        }
        // If its not in the list of supported extensions, this is likely a
        // TypeScript file with a non-ts extension
        return ExtensionPriority.Highest;
    }
    /**
     * Adjusts an extension priority to be the highest priority within the same range.
     */
    export function adjustExtensionPriority(extensionPriority: ExtensionPriority, supportedExtensions: readonly string[]): ExtensionPriority {
        if (extensionPriority < ExtensionPriority.DeclarationAndJavaScriptFiles) {
            return ExtensionPriority.TypeScriptFiles;
        }
        else if (extensionPriority < supportedExtensions.length) {
            return ExtensionPriority.DeclarationAndJavaScriptFiles;
        }
        else {
            return supportedExtensions.length;
        }
    }
    /**
     * Gets the next lowest extension priority for a given priority.
     */
    export function getNextLowestExtensionPriority(extensionPriority: ExtensionPriority, supportedExtensions: readonly string[]): ExtensionPriority {
        if (extensionPriority < ExtensionPriority.DeclarationAndJavaScriptFiles) {
            return ExtensionPriority.DeclarationAndJavaScriptFiles;
        }
        else {
            return supportedExtensions.length;
        }
    }
    const extensionsToRemove = [ts.Extension.Dts, ts.Extension.Ts, ts.Extension.Js, ts.Extension.Tsx, ts.Extension.Jsx, ts.Extension.Json];
    export function removeFileExtension(path: string): string {
        for (const ext of extensionsToRemove) {
            const extensionless = tryRemoveExtension(path, ext);
            if (extensionless !== undefined) {
                return extensionless;
            }
        }
        return path;
    }
    export function tryRemoveExtension(path: string, extension: string): string | undefined {
        return ts.fileExtensionIs(path, extension) ? removeExtension(path, extension) : undefined;
    }
    export function removeExtension(path: string, extension: string): string {
        return path.substring(0, path.length - extension.length);
    }
    export function changeExtension<T extends string | ts.Path>(path: T, newExtension: string): T {
        return <T>ts.changeAnyExtension(path, newExtension, extensionsToRemove, /*ignoreCase*/ false);
    }
    export function tryParsePattern(pattern: string): ts.Pattern | undefined {
        // This should be verified outside of here and a proper error thrown.
        ts.Debug.assert(hasZeroOrOneAsteriskCharacter(pattern));
        const indexOfStar = pattern.indexOf("*");
        return indexOfStar === -1 ? undefined : {
            prefix: pattern.substr(0, indexOfStar),
            suffix: pattern.substr(indexOfStar + 1)
        };
    }
    export function positionIsSynthesized(pos: number): boolean {
        // This is a fast way of testing the following conditions:
        //  pos === undefined || pos === null || isNaN(pos) || pos < 0;
        return !(pos >= 0);
    }
    /** True if an extension is one of the supported TypeScript extensions. */
    export function extensionIsTS(ext: ts.Extension): boolean {
        return ext === ts.Extension.Ts || ext === ts.Extension.Tsx || ext === ts.Extension.Dts;
    }
    export function resolutionExtensionIsTSOrJson(ext: ts.Extension) {
        return extensionIsTS(ext) || ext === ts.Extension.Json;
    }
    /**
     * Gets the extension from a path.
     * Path must have a valid extension.
     */
    export function extensionFromPath(path: string): ts.Extension {
        const ext = tryGetExtensionFromPath(path);
        return ext !== undefined ? ext : ts.Debug.fail(`File ${path} has unknown extension.`);
    }
    export function isAnySupportedFileExtension(path: string): boolean {
        return tryGetExtensionFromPath(path) !== undefined;
    }
    export function tryGetExtensionFromPath(path: string): ts.Extension | undefined {
        return ts.find<ts.Extension>(extensionsToRemove, e => ts.fileExtensionIs(path, e));
    }
    export function isCheckJsEnabledForFile(sourceFile: ts.SourceFile, compilerOptions: ts.CompilerOptions) {
        return sourceFile.checkJsDirective ? sourceFile.checkJsDirective.enabled : compilerOptions.checkJs;
    }
    export const emptyFileSystemEntries: FileSystemEntries = {
        files: ts.emptyArray,
        directories: ts.emptyArray
    };
    /**
     * patternStrings contains both pattern strings (containing "*") and regular strings.
     * Return an exact match if possible, or a pattern match, or undefined.
     * (These are verified by verifyCompilerOptions to have 0 or 1 "*" characters.)
     */
    export function matchPatternOrExact(patternStrings: readonly string[], candidate: string): string | ts.Pattern | undefined {
        const patterns: ts.Pattern[] = [];
        for (const patternString of patternStrings) {
            if (!hasZeroOrOneAsteriskCharacter(patternString))
                continue;
            const pattern = tryParsePattern(patternString);
            if (pattern) {
                patterns.push(pattern);
            }
            else if (patternString === candidate) {
                // pattern was matched as is - no need to search further
                return patternString;
            }
        }
        return ts.findBestPatternMatch(patterns, _ => _, candidate);
    }
    export type Mutable<T extends object> = {
        -readonly [K in keyof T]: T[K];
    };
    export function sliceAfter<T>(arr: readonly T[], value: T): readonly T[] {
        const index = arr.indexOf(value);
        ts.Debug.assert(index !== -1);
        return arr.slice(index);
    }
    export function addRelatedInfo<T extends ts.Diagnostic>(diagnostic: T, ...relatedInformation: ts.DiagnosticRelatedInformation[]): T {
        if (!diagnostic.relatedInformation) {
            diagnostic.relatedInformation = [];
        }
        diagnostic.relatedInformation.push(...relatedInformation);
        return diagnostic;
    }
    export function minAndMax<T>(arr: readonly T[], getValue: (value: T) => number): {
        readonly min: number;
        readonly max: number;
    } {
        ts.Debug.assert(arr.length !== 0);
        let min = getValue(arr[0]);
        let max = min;
        for (let i = 1; i < arr.length; i++) {
            const value = getValue(arr[i]);
            if (value < min) {
                min = value;
            }
            else if (value > max) {
                max = value;
            }
        }
        return { min, max };
    }
    export interface ReadonlyNodeSet<TNode extends ts.Node> {
        has(node: TNode): boolean;
        forEach(cb: (node: TNode) => void): void;
        some(pred: (node: TNode) => boolean): boolean;
    }
    export class NodeSet<TNode extends ts.Node> implements ReadonlyNodeSet<TNode> {
        private map = ts.createMap<TNode>();
        add(node: TNode): void {
            this.map.set(String(ts.getNodeId(node)), node);
        }
        tryAdd(node: TNode): boolean {
            if (this.has(node))
                return false;
            this.add(node);
            return true;
        }
        has(node: TNode): boolean {
            return this.map.has(String(ts.getNodeId(node)));
        }
        forEach(cb: (node: TNode) => void): void {
            this.map.forEach(cb);
        }
        some(pred: (node: TNode) => boolean): boolean {
            return forEachEntry(this.map, pred) || false;
        }
    }
    export interface ReadonlyNodeMap<TNode extends ts.Node, TValue> {
        get(node: TNode): TValue | undefined;
        has(node: TNode): boolean;
    }
    export class NodeMap<TNode extends ts.Node, TValue> implements ReadonlyNodeMap<TNode, TValue> {
        private map = ts.createMap<{
            node: TNode;
            value: TValue;
        }>();
        get(node: TNode): TValue | undefined {
            const res = this.map.get(String(ts.getNodeId(node)));
            return res && res.value;
        }
        getOrUpdate(node: TNode, setValue: () => TValue): TValue {
            const res = this.get(node);
            if (res)
                return res;
            const value = setValue();
            this.set(node, value);
            return value;
        }
        set(node: TNode, value: TValue): void {
            this.map.set(String(ts.getNodeId(node)), { node, value });
        }
        has(node: TNode): boolean {
            return this.map.has(String(ts.getNodeId(node)));
        }
        forEach(cb: (value: TValue, node: TNode) => void): void {
            this.map.forEach(({ node, value }) => cb(value, node));
        }
    }
    export function rangeOfNode(node: ts.Node): ts.TextRange {
        return { pos: getTokenPosOfNode(node), end: node.end };
    }
    export function rangeOfTypeParameters(typeParameters: ts.NodeArray<ts.TypeParameterDeclaration>): ts.TextRange {
        // Include the `<>`
        return { pos: typeParameters.pos - 1, end: typeParameters.end + 1 };
    }
    export interface HostWithIsSourceOfProjectReferenceRedirect {
        isSourceOfProjectReferenceRedirect(fileName: string): boolean;
    }
    export function skipTypeChecking(sourceFile: ts.SourceFile, options: ts.CompilerOptions, host: HostWithIsSourceOfProjectReferenceRedirect) {
        // If skipLibCheck is enabled, skip reporting errors if file is a declaration file.
        // If skipDefaultLibCheck is enabled, skip reporting errors if file contains a
        // '/// <reference no-default-lib="true"/>' directive.
        return (options.skipLibCheck && sourceFile.isDeclarationFile ||
            options.skipDefaultLibCheck && sourceFile.hasNoDefaultLib) ||
            host.isSourceOfProjectReferenceRedirect(sourceFile.fileName);
    }
    export function isJsonEqual(a: unknown, b: unknown): boolean {
        // eslint-disable-next-line no-null/no-null
        return a === b || typeof a === "object" && a !== null && typeof b === "object" && b !== null && ts.equalOwnProperties((a as ts.MapLike<unknown>), (b as ts.MapLike<unknown>), isJsonEqual);
    }
    export function getOrUpdate<T>(map: ts.Map<T>, key: string, getDefault: () => T): T {
        const got = map.get(key);
        if (got === undefined) {
            const value = getDefault();
            map.set(key, value);
            return value;
        }
        else {
            return got;
        }
    }
    /**
     * Converts a bigint literal string, e.g. `0x1234n`,
     * to its decimal string representation, e.g. `4660`.
     */
    export function parsePseudoBigInt(stringValue: string): string {
        let log2Base: number;
        switch (stringValue.charCodeAt(1)) { // "x" in "0x123"
            case ts.CharacterCodes.b:
            case ts.CharacterCodes.B: // 0b or 0B
                log2Base = 1;
                break;
            case ts.CharacterCodes.o:
            case ts.CharacterCodes.O: // 0o or 0O
                log2Base = 3;
                break;
            case ts.CharacterCodes.x:
            case ts.CharacterCodes.X: // 0x or 0X
                log2Base = 4;
                break;
            default: // already in decimal; omit trailing "n"
                const nIndex = stringValue.length - 1;
                // Skip leading 0s
                let nonZeroStart = 0;
                while (stringValue.charCodeAt(nonZeroStart) === ts.CharacterCodes._0) {
                    nonZeroStart++;
                }
                return stringValue.slice(nonZeroStart, nIndex) || "0";
        }
        // Omit leading "0b", "0o", or "0x", and trailing "n"
        const startIndex = 2, endIndex = stringValue.length - 1;
        const bitsNeeded = (endIndex - startIndex) * log2Base;
        // Stores the value specified by the string as a LE array of 16-bit integers
        // using Uint16 instead of Uint32 so combining steps can use bitwise operators
        const segments = new Uint16Array((bitsNeeded >>> 4) + (bitsNeeded & 15 ? 1 : 0));
        // Add the digits, one at a time
        for (let i = endIndex - 1, bitOffset = 0; i >= startIndex; i--, bitOffset += log2Base) {
            const segment = bitOffset >>> 4;
            const digitChar = stringValue.charCodeAt(i);
            // Find character range: 0-9 < A-F < a-f
            const digit = digitChar <= ts.CharacterCodes._9
                ? digitChar - ts.CharacterCodes._0
                : 10 + digitChar -
                    (digitChar <= ts.CharacterCodes.F ? ts.CharacterCodes.A : ts.CharacterCodes.a);
            const shiftedDigit = digit << (bitOffset & 15);
            segments[segment] |= shiftedDigit;
            const residual = shiftedDigit >>> 16;
            if (residual)
                segments[segment + 1] |= residual; // overflows segment
        }
        // Repeatedly divide segments by 10 and add remainder to base10Value
        let base10Value = "";
        let firstNonzeroSegment = segments.length - 1;
        let segmentsRemaining = true;
        while (segmentsRemaining) {
            let mod10 = 0;
            segmentsRemaining = false;
            for (let segment = firstNonzeroSegment; segment >= 0; segment--) {
                const newSegment = mod10 << 16 | segments[segment];
                const segmentValue = (newSegment / 10) | 0;
                segments[segment] = segmentValue;
                mod10 = newSegment - segmentValue * 10;
                if (segmentValue && !segmentsRemaining) {
                    firstNonzeroSegment = segment;
                    segmentsRemaining = true;
                }
            }
            base10Value = mod10 + base10Value;
        }
        return base10Value;
    }
    export function pseudoBigIntToString({ negative, base10Value }: ts.PseudoBigInt): string {
        return (negative && base10Value !== "0" ? "-" : "") + base10Value;
    }
}
