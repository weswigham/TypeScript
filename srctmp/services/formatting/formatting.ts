import * as ts from "../ts";
/* @internal */
export interface FormatContext {
    readonly options: ts.FormatCodeSettings;
    readonly getRules: ts.formatting.RulesMap;
}
/* @internal */
export interface TextRangeWithKind<T extends ts.SyntaxKind = ts.SyntaxKind> extends ts.TextRange {
    kind: T;
}
/* @internal */
export type TextRangeWithTriviaKind = TextRangeWithKind<ts.TriviaKind>;
/* @internal */
export interface TokenInfo {
    leadingTrivia: TextRangeWithTriviaKind[] | undefined;
    token: TextRangeWithKind;
    trailingTrivia: TextRangeWithTriviaKind[] | undefined;
}
/* @internal */
export function createTextRangeWithKind<T extends ts.SyntaxKind>(pos: number, end: number, kind: T): TextRangeWithKind<T> {
    const textRangeWithKind: TextRangeWithKind<T> = { pos, end, kind };
    if (ts.Debug.isDebugging) {
        Object.defineProperty(textRangeWithKind, "__debugKind", {
            get: () => ts.Debug.formatSyntaxKind(kind),
        });
    }
    return textRangeWithKind;
}
/* @internal */
const enum Constants {
    Unknown = -1
}
/*
 * Indentation for the scope that can be dynamically recomputed.
 * i.e
 * while(true)
 * { let x;
 * }
 * Normally indentation is applied only to the first token in line so at glance 'let' should not be touched.
 * However if some format rule adds new line between '}' and 'let' 'let' will become
 * the first token in line so it should be indented
 */
/* @internal */
interface DynamicIndentation {
    getIndentationForToken(tokenLine: number, tokenKind: ts.SyntaxKind, container: ts.Node, suppressDelta: boolean): number;
    getIndentationForComment(owningToken: ts.SyntaxKind, tokenIndentation: number, container: ts.Node): number;
    /**
     * Indentation for open and close tokens of the node if it is block or another node that needs special indentation
     * ... {
     * .........<child>
     * ....}
     *  ____ - indentation
     *      ____ - delta
     */
    getIndentation(): number;
    /**
     * Prefered relative indentation for child nodes.
     * Delta is used to carry the indentation info
     * foo(bar({
     *     $
     * }))
     * Both 'foo', 'bar' introduce new indentation with delta = 4, but total indentation in $ is not 8.
     * foo: { indentation: 0, delta: 4 }
     * bar: { indentation: foo.indentation + foo.delta = 4, delta: 4} however 'foo' and 'bar' are on the same line
     * so bar inherits indentation from foo and bar.delta will be 4
     *
     */
    getDelta(child: TextRangeWithKind): number;
    /**
     * Formatter calls this function when rule adds or deletes new lines from the text
     * so indentation scope can adjust values of indentation and delta.
     */
    recomputeIndentation(lineAddedByFormatting: boolean): void;
}
/* @internal */
export function formatOnEnter(position: number, sourceFile: ts.SourceFile, formatContext: FormatContext): ts.TextChange[] {
    const line = sourceFile.getLineAndCharacterOfPosition(position).line;
    if (line === 0) {
        return [];
    }
    // After the enter key, the cursor is now at a new line. The new line may or may not contain non-whitespace characters.
    // If the new line has only whitespaces, we won't want to format this line, because that would remove the indentation as
    // trailing whitespaces. So the end of the formatting span should be the later one between:
    //  1. the end of the previous line
    //  2. the last non-whitespace character in the current line
    let endOfFormatSpan = ts.getEndLinePosition(line, sourceFile);
    while (ts.isWhiteSpaceSingleLine(sourceFile.text.charCodeAt(endOfFormatSpan))) {
        endOfFormatSpan--;
    }
    // if the character at the end of the span is a line break, we shouldn't include it, because it indicates we don't want to
    // touch the current line at all. Also, on some OSes the line break consists of two characters (\r\n), we should test if the
    // previous character before the end of format span is line break character as well.
    if (ts.isLineBreak(sourceFile.text.charCodeAt(endOfFormatSpan))) {
        endOfFormatSpan--;
    }
    const span = {
        // get start position for the previous line
        pos: ts.getStartPositionOfLine(line - 1, sourceFile),
        // end value is exclusive so add 1 to the result
        end: endOfFormatSpan + 1
    };
    return formatSpan(span, sourceFile, formatContext, ts.formatting.FormattingRequestKind.FormatOnEnter);
}
/* @internal */
export function formatOnSemicolon(position: number, sourceFile: ts.SourceFile, formatContext: FormatContext): ts.TextChange[] {
    const semicolon = findImmediatelyPrecedingTokenOfKind(position, ts.SyntaxKind.SemicolonToken, sourceFile);
    return formatNodeLines(findOutermostNodeWithinListLevel(semicolon), sourceFile, formatContext, ts.formatting.FormattingRequestKind.FormatOnSemicolon);
}
/* @internal */
export function formatOnOpeningCurly(position: number, sourceFile: ts.SourceFile, formatContext: FormatContext): ts.TextChange[] {
    const openingCurly = findImmediatelyPrecedingTokenOfKind(position, ts.SyntaxKind.OpenBraceToken, sourceFile);
    if (!openingCurly) {
        return [];
    }
    const curlyBraceRange = openingCurly.parent;
    const outermostNode = findOutermostNodeWithinListLevel(curlyBraceRange);
    /**
     * We limit the span to end at the opening curly to handle the case where
     * the brace matched to that just typed will be incorrect after further edits.
     * For example, we could type the opening curly for the following method
     * body without brace-matching activated:
     * ```
     * class C {
     *     foo()
     * }
     * ```
     * and we wouldn't want to move the closing brace.
     */
    const textRange: ts.TextRange = {
        pos: ts.getLineStartPositionForPosition(outermostNode!.getStart(sourceFile), sourceFile),
        end: position
    };
    return formatSpan(textRange, sourceFile, formatContext, ts.formatting.FormattingRequestKind.FormatOnOpeningCurlyBrace);
}
/* @internal */
export function formatOnClosingCurly(position: number, sourceFile: ts.SourceFile, formatContext: FormatContext): ts.TextChange[] {
    const precedingToken = findImmediatelyPrecedingTokenOfKind(position, ts.SyntaxKind.CloseBraceToken, sourceFile);
    return formatNodeLines(findOutermostNodeWithinListLevel(precedingToken), sourceFile, formatContext, ts.formatting.FormattingRequestKind.FormatOnClosingCurlyBrace);
}
/* @internal */
export function formatDocument(sourceFile: ts.SourceFile, formatContext: FormatContext): ts.TextChange[] {
    const span = {
        pos: 0,
        end: sourceFile.text.length
    };
    return formatSpan(span, sourceFile, formatContext, ts.formatting.FormattingRequestKind.FormatDocument);
}
/* @internal */
export function formatSelection(start: number, end: number, sourceFile: ts.SourceFile, formatContext: FormatContext): ts.TextChange[] {
    // format from the beginning of the line
    const span = {
        pos: ts.getLineStartPositionForPosition(start, sourceFile),
        end,
    };
    return formatSpan(span, sourceFile, formatContext, ts.formatting.FormattingRequestKind.FormatSelection);
}
/**
 * Validating `expectedTokenKind` ensures the token was typed in the context we expect (eg: not a comment).
 * @param expectedTokenKind The kind of the last token constituting the desired parent node.
 */
/* @internal */
function findImmediatelyPrecedingTokenOfKind(end: number, expectedTokenKind: ts.SyntaxKind, sourceFile: ts.SourceFile): ts.Node | undefined {
    const precedingToken = ts.findPrecedingToken(end, sourceFile);
    return precedingToken && precedingToken.kind === expectedTokenKind && end === precedingToken.getEnd() ?
        precedingToken :
        undefined;
}
/**
 * Finds the highest node enclosing `node` at the same list level as `node`
 * and whose end does not exceed `node.end`.
 *
 * Consider typing the following
 * ```
 * let x = 1;
 * while (true) {
 * }
 * ```
 * Upon typing the closing curly, we want to format the entire `while`-statement, but not the preceding
 * variable declaration.
 */
/* @internal */
function findOutermostNodeWithinListLevel(node: ts.Node | undefined) {
    let current = node;
    while (current &&
        current.parent &&
        current.parent.end === node!.end &&
        !isListElement(current.parent, current)) {
        current = current.parent;
    }
    return current;
}
// Returns true if node is a element in some list in parent
// i.e. parent is class declaration with the list of members and node is one of members.
/* @internal */
function isListElement(parent: ts.Node, node: ts.Node): boolean {
    switch (parent.kind) {
        case ts.SyntaxKind.ClassDeclaration:
        case ts.SyntaxKind.InterfaceDeclaration:
            return ts.rangeContainsRange((<ts.InterfaceDeclaration>parent).members, node);
        case ts.SyntaxKind.ModuleDeclaration:
            const body = (<ts.ModuleDeclaration>parent).body;
            return !!body && body.kind === ts.SyntaxKind.ModuleBlock && ts.rangeContainsRange(body.statements, node);
        case ts.SyntaxKind.SourceFile:
        case ts.SyntaxKind.Block:
        case ts.SyntaxKind.ModuleBlock:
            return ts.rangeContainsRange((<ts.Block>parent).statements, node);
        case ts.SyntaxKind.CatchClause:
            return ts.rangeContainsRange((<ts.CatchClause>parent).block.statements, node);
    }
    return false;
}
/** find node that fully contains given text range */
/* @internal */
function findEnclosingNode(range: ts.TextRange, sourceFile: ts.SourceFile): ts.Node {
    return find(sourceFile);
    function find(n: ts.Node): ts.Node {
        const candidate = ts.forEachChild(n, c => ts.startEndContainsRange(c.getStart(sourceFile), c.end, range) && c);
        if (candidate) {
            const result = find(candidate);
            if (result) {
                return result;
            }
        }
        return n;
    }
}
/** formatting is not applied to ranges that contain parse errors.
 * This function will return a predicate that for a given text range will tell
 * if there are any parse errors that overlap with the range.
 */
/* @internal */
function prepareRangeContainsErrorFunction(errors: readonly ts.Diagnostic[], originalRange: ts.TextRange): (r: ts.TextRange) => boolean {
    if (!errors.length) {
        return rangeHasNoErrors;
    }
    // pick only errors that fall in range
    const sorted = errors
        .filter(d => ts.rangeOverlapsWithStartEnd(originalRange, (d.start!), d.start! + d.length!)) // TODO: GH#18217
        .sort((e1, e2) => e1.start! - e2.start!);
    if (!sorted.length) {
        return rangeHasNoErrors;
    }
    let index = 0;
    return r => {
        // in current implementation sequence of arguments [r1, r2...] is monotonically increasing.
        // 'index' tracks the index of the most recent error that was checked.
        while (true) {
            if (index >= sorted.length) {
                // all errors in the range were already checked -> no error in specified range
                return false;
            }
            const error = sorted[index];
            if (r.end <= error.start!) {
                // specified range ends before the error refered by 'index' - no error in range
                return false;
            }
            if (ts.startEndOverlapsWithStartEnd(r.pos, r.end, (error.start!), error.start! + error.length!)) {
                // specified range overlaps with error range
                return true;
            }
            index++;
        }
    };
    function rangeHasNoErrors(): boolean {
        return false;
    }
}
/**
 * Start of the original range might fall inside the comment - scanner will not yield appropriate results
 * This function will look for token that is located before the start of target range
 * and return its end as start position for the scanner.
 */
/* @internal */
function getScanStartPosition(enclosingNode: ts.Node, originalRange: ts.TextRange, sourceFile: ts.SourceFile): number {
    const start = enclosingNode.getStart(sourceFile);
    if (start === originalRange.pos && enclosingNode.end === originalRange.end) {
        return start;
    }
    const precedingToken = ts.findPrecedingToken(originalRange.pos, sourceFile);
    if (!precedingToken) {
        // no preceding token found - start from the beginning of enclosing node
        return enclosingNode.pos;
    }
    // preceding token ends after the start of original range (i.e when originalRange.pos falls in the middle of literal)
    // start from the beginning of enclosingNode to handle the entire 'originalRange'
    if (precedingToken.end >= originalRange.pos) {
        return enclosingNode.pos;
    }
    return precedingToken.end;
}
/*
 * For cases like
 * if (a ||
 *     b ||$
 *     c) {...}
 * If we hit Enter at $ we want line '    b ||' to be indented.
 * Formatting will be applied to the last two lines.
 * Node that fully encloses these lines is binary expression 'a ||...'.
 * Initial indentation for this node will be 0.
 * Binary expressions don't introduce new indentation scopes, however it is possible
 * that some parent node on the same line does - like if statement in this case.
 * Note that we are considering parents only from the same line with initial node -
 * if parent is on the different line - its delta was already contributed
 * to the initial indentation.
 */
/* @internal */
function getOwnOrInheritedDelta(n: ts.Node, options: ts.FormatCodeSettings, sourceFile: ts.SourceFile): number {
    let previousLine = Constants.Unknown;
    let child: ts.Node | undefined;
    while (n) {
        const line = sourceFile.getLineAndCharacterOfPosition(n.getStart(sourceFile)).line;
        if (previousLine !== Constants.Unknown && line !== previousLine) {
            break;
        }
        if (ts.formatting.SmartIndenter.shouldIndentChildNode(options, n, child, sourceFile)) {
            return options.indentSize!;
        }
        previousLine = line;
        child = n;
        n = n.parent;
    }
    return 0;
}
/* @internal */
export function formatNodeGivenIndentation(node: ts.Node, sourceFileLike: ts.SourceFileLike, languageVariant: ts.LanguageVariant, initialIndentation: number, delta: number, formatContext: FormatContext): ts.TextChange[] {
    const range = { pos: 0, end: sourceFileLike.text.length };
    return ts.formatting.getFormattingScanner(sourceFileLike.text, languageVariant, range.pos, range.end, scanner => formatSpanWorker(range, node, initialIndentation, delta, scanner, formatContext, ts.formatting.FormattingRequestKind.FormatSelection, _ => false, // assume that node does not have any errors
    sourceFileLike));
}
/* @internal */
function formatNodeLines(node: ts.Node | undefined, sourceFile: ts.SourceFile, formatContext: FormatContext, requestKind: ts.formatting.FormattingRequestKind): ts.TextChange[] {
    if (!node) {
        return [];
    }
    const span = {
        pos: ts.getLineStartPositionForPosition(node.getStart(sourceFile), sourceFile),
        end: node.end
    };
    return formatSpan(span, sourceFile, formatContext, requestKind);
}
/* @internal */
function formatSpan(originalRange: ts.TextRange, sourceFile: ts.SourceFile, formatContext: FormatContext, requestKind: ts.formatting.FormattingRequestKind): ts.TextChange[] {
    // find the smallest node that fully wraps the range and compute the initial indentation for the node
    const enclosingNode = findEnclosingNode(originalRange, sourceFile);
    return ts.formatting.getFormattingScanner(sourceFile.text, sourceFile.languageVariant, getScanStartPosition(enclosingNode, originalRange, sourceFile), originalRange.end, scanner => formatSpanWorker(originalRange, enclosingNode, ts.formatting.SmartIndenter.getIndentationForNode(enclosingNode, originalRange, sourceFile, formatContext.options), getOwnOrInheritedDelta(enclosingNode, formatContext.options, sourceFile), scanner, formatContext, requestKind, prepareRangeContainsErrorFunction(sourceFile.parseDiagnostics, originalRange), sourceFile));
}
/* @internal */
function formatSpanWorker(originalRange: ts.TextRange, enclosingNode: ts.Node, initialIndentation: number, delta: number, formattingScanner: ts.formatting.FormattingScanner, { options, getRules }: FormatContext, requestKind: ts.formatting.FormattingRequestKind, rangeContainsError: (r: ts.TextRange) => boolean, sourceFile: ts.SourceFileLike): ts.TextChange[] {
    // formatting context is used by rules provider
    const formattingContext = new ts.formatting.FormattingContext(sourceFile, requestKind, options);
    let previousRange: TextRangeWithKind;
    let previousParent: ts.Node;
    let previousRangeStartLine: number;
    let lastIndentedLine: number;
    let indentationOnLastIndentedLine = Constants.Unknown;
    const edits: ts.TextChange[] = [];
    formattingScanner.advance();
    if (formattingScanner.isOnToken()) {
        const startLine = sourceFile.getLineAndCharacterOfPosition(enclosingNode.getStart(sourceFile)).line;
        let undecoratedStartLine = startLine;
        if (enclosingNode.decorators) {
            undecoratedStartLine = sourceFile.getLineAndCharacterOfPosition(ts.getNonDecoratorTokenPosOfNode(enclosingNode, sourceFile)).line;
        }
        processNode(enclosingNode, enclosingNode, startLine, undecoratedStartLine, initialIndentation, delta);
    }
    if (!formattingScanner.isOnToken()) {
        const leadingTrivia = formattingScanner.getCurrentLeadingTrivia();
        if (leadingTrivia) {
            indentTriviaItems(leadingTrivia, initialIndentation, /*indentNextTokenOrTrivia*/ false, item => processRange(item, sourceFile.getLineAndCharacterOfPosition(item.pos), enclosingNode, enclosingNode, /*dynamicIndentation*/ undefined!));
            trimTrailingWhitespacesForRemainingRange();
        }
    }
    return edits;
    // local functions
    /** Tries to compute the indentation for a list element.
     * If list element is not in range then
     * function will pick its actual indentation
     * so it can be pushed downstream as inherited indentation.
     * If list element is in the range - its indentation will be equal
     * to inherited indentation from its predecessors.
     */
    function tryComputeIndentationForListItem(startPos: number, endPos: number, parentStartLine: number, range: ts.TextRange, inheritedIndentation: number): number {
        if (ts.rangeOverlapsWithStartEnd(range, startPos, endPos) ||
            ts.rangeContainsStartEnd(range, startPos, endPos) /* Not to miss zero-range nodes e.g. JsxText */) {
            if (inheritedIndentation !== Constants.Unknown) {
                return inheritedIndentation;
            }
        }
        else {
            const startLine = sourceFile.getLineAndCharacterOfPosition(startPos).line;
            const startLinePosition = ts.getLineStartPositionForPosition(startPos, sourceFile);
            const column = ts.formatting.SmartIndenter.findFirstNonWhitespaceColumn(startLinePosition, startPos, sourceFile, options);
            if (startLine !== parentStartLine || startPos === column) {
                // Use the base indent size if it is greater than
                // the indentation of the inherited predecessor.
                const baseIndentSize = ts.formatting.SmartIndenter.getBaseIndentation(options);
                return baseIndentSize > column ? baseIndentSize : column;
            }
        }
        return Constants.Unknown;
    }
    function computeIndentation(node: TextRangeWithKind, startLine: number, inheritedIndentation: number, parent: ts.Node, parentDynamicIndentation: DynamicIndentation, effectiveParentStartLine: number): {
        indentation: number;
        delta: number;
    } {
        const delta = ts.formatting.SmartIndenter.shouldIndentChildNode(options, node) ? options.indentSize! : 0;
        if (effectiveParentStartLine === startLine) {
            // if node is located on the same line with the parent
            // - inherit indentation from the parent
            // - push children if either parent of node itself has non-zero delta
            return {
                indentation: startLine === lastIndentedLine ? indentationOnLastIndentedLine : parentDynamicIndentation.getIndentation(),
                delta: Math.min(options.indentSize!, parentDynamicIndentation.getDelta(node) + delta)
            };
        }
        else if (inheritedIndentation === Constants.Unknown) {
            if (node.kind === ts.SyntaxKind.OpenParenToken && startLine === lastIndentedLine) {
                // the is used for chaining methods formatting
                // - we need to get the indentation on last line and the delta of parent
                return { indentation: indentationOnLastIndentedLine, delta: parentDynamicIndentation.getDelta(node) };
            }
            else if (ts.formatting.SmartIndenter.childStartsOnTheSameLineWithElseInIfStatement(parent, node, startLine, sourceFile)) {
                return { indentation: parentDynamicIndentation.getIndentation(), delta };
            }
            else if (ts.formatting.SmartIndenter.argumentStartsOnSameLineAsPreviousArgument(parent, node, startLine, sourceFile)) {
                return { indentation: parentDynamicIndentation.getIndentation(), delta };
            }
            else {
                return { indentation: parentDynamicIndentation.getIndentation() + parentDynamicIndentation.getDelta(node), delta };
            }
        }
        else {
            return { indentation: inheritedIndentation, delta };
        }
    }
    function getFirstNonDecoratorTokenOfNode(node: ts.Node) {
        if (node.modifiers && node.modifiers.length) {
            return node.modifiers[0].kind;
        }
        switch (node.kind) {
            case ts.SyntaxKind.ClassDeclaration: return ts.SyntaxKind.ClassKeyword;
            case ts.SyntaxKind.InterfaceDeclaration: return ts.SyntaxKind.InterfaceKeyword;
            case ts.SyntaxKind.FunctionDeclaration: return ts.SyntaxKind.FunctionKeyword;
            case ts.SyntaxKind.EnumDeclaration: return ts.SyntaxKind.EnumDeclaration;
            case ts.SyntaxKind.GetAccessor: return ts.SyntaxKind.GetKeyword;
            case ts.SyntaxKind.SetAccessor: return ts.SyntaxKind.SetKeyword;
            case ts.SyntaxKind.MethodDeclaration:
                if ((<ts.MethodDeclaration>node).asteriskToken) {
                    return ts.SyntaxKind.AsteriskToken;
                }
            // falls through
            case ts.SyntaxKind.PropertyDeclaration:
            case ts.SyntaxKind.Parameter:
                const name = ts.getNameOfDeclaration((<ts.Declaration>node));
                if (name) {
                    return name.kind;
                }
        }
    }
    function getDynamicIndentation(node: ts.Node, nodeStartLine: number, indentation: number, delta: number): DynamicIndentation {
        return {
            getIndentationForComment: (kind, tokenIndentation, container) => {
                switch (kind) {
                    // preceding comment to the token that closes the indentation scope inherits the indentation from the scope
                    // ..  {
                    //     // comment
                    // }
                    case ts.SyntaxKind.CloseBraceToken:
                    case ts.SyntaxKind.CloseBracketToken:
                    case ts.SyntaxKind.CloseParenToken:
                        return indentation + getDelta(container);
                }
                return tokenIndentation !== Constants.Unknown ? tokenIndentation : indentation;
            },
            // if list end token is LessThanToken '>' then its delta should be explicitly suppressed
            // so that LessThanToken as a binary operator can still be indented.
            // foo.then
            //     <
            //         number,
            //         string,
            //     >();
            // vs
            // var a = xValue
            //     > yValue;
            getIndentationForToken: (line, kind, container, suppressDelta) => !suppressDelta && shouldAddDelta(line, kind, container) ? indentation + getDelta(container) : indentation,
            getIndentation: () => indentation,
            getDelta,
            recomputeIndentation: lineAdded => {
                if (node.parent && ts.formatting.SmartIndenter.shouldIndentChildNode(options, node.parent, node, sourceFile)) {
                    indentation += lineAdded ? options.indentSize! : -options.indentSize!;
                    delta = ts.formatting.SmartIndenter.shouldIndentChildNode(options, node) ? options.indentSize! : 0;
                }
            }
        };
        function shouldAddDelta(line: number, kind: ts.SyntaxKind, container: ts.Node): boolean {
            switch (kind) {
                // open and close brace, 'else' and 'while' (in do statement) tokens has indentation of the parent
                case ts.SyntaxKind.OpenBraceToken:
                case ts.SyntaxKind.CloseBraceToken:
                case ts.SyntaxKind.CloseParenToken:
                case ts.SyntaxKind.ElseKeyword:
                case ts.SyntaxKind.WhileKeyword:
                case ts.SyntaxKind.AtToken:
                    return false;
                case ts.SyntaxKind.SlashToken:
                case ts.SyntaxKind.GreaterThanToken:
                    switch (container.kind) {
                        case ts.SyntaxKind.JsxOpeningElement:
                        case ts.SyntaxKind.JsxClosingElement:
                        case ts.SyntaxKind.JsxSelfClosingElement:
                            return false;
                    }
                    break;
                case ts.SyntaxKind.OpenBracketToken:
                case ts.SyntaxKind.CloseBracketToken:
                    if (container.kind !== ts.SyntaxKind.MappedType) {
                        return false;
                    }
                    break;
            }
            // if token line equals to the line of containing node (this is a first token in the node) - use node indentation
            return nodeStartLine !== line
                // if this token is the first token following the list of decorators, we do not need to indent
                && !(node.decorators && kind === getFirstNonDecoratorTokenOfNode(node));
        }
        function getDelta(child: TextRangeWithKind) {
            // Delta value should be zero when the node explicitly prevents indentation of the child node
            return ts.formatting.SmartIndenter.nodeWillIndentChild(options, node, child, sourceFile, /*indentByDefault*/ true) ? delta : 0;
        }
    }
    function processNode(node: ts.Node, contextNode: ts.Node, nodeStartLine: number, undecoratedNodeStartLine: number, indentation: number, delta: number) {
        if (!ts.rangeOverlapsWithStartEnd(originalRange, node.getStart(sourceFile), node.getEnd())) {
            return;
        }
        const nodeDynamicIndentation = getDynamicIndentation(node, nodeStartLine, indentation, delta);
        // a useful observations when tracking context node
        //        /
        //      [a]
        //   /   |   \
        //  [b] [c] [d]
        // node 'a' is a context node for nodes 'b', 'c', 'd'
        // except for the leftmost leaf token in [b] - in this case context node ('e') is located somewhere above 'a'
        // this rule can be applied recursively to child nodes of 'a'.
        //
        // context node is set to parent node value after processing every child node
        // context node is set to parent of the token after processing every token
        let childContextNode = contextNode;
        // if there are any tokens that logically belong to node and interleave child nodes
        // such tokens will be consumed in processChildNode for the child that follows them
        ts.forEachChild(node, child => {
            processChildNode(child, /*inheritedIndentation*/ Constants.Unknown, node, nodeDynamicIndentation, nodeStartLine, undecoratedNodeStartLine, /*isListItem*/ false);
        }, nodes => {
            processChildNodes(nodes, node, nodeStartLine, nodeDynamicIndentation);
        });
        // proceed any tokens in the node that are located after child nodes
        while (formattingScanner.isOnToken()) {
            const tokenInfo = formattingScanner.readTokenInfo(node);
            if (tokenInfo.token.end > node.end) {
                break;
            }
            consumeTokenAndAdvanceScanner(tokenInfo, node, nodeDynamicIndentation, node);
        }
        if (!node.parent && formattingScanner.isOnEOF()) {
            const token = formattingScanner.readEOFTokenRange();
            if (token.end <= node.end && previousRange) {
                processPair(token, sourceFile.getLineAndCharacterOfPosition(token.pos).line, node, previousRange, previousRangeStartLine, previousParent, contextNode, nodeDynamicIndentation);
            }
        }
        function processChildNode(child: ts.Node, inheritedIndentation: number, parent: ts.Node, parentDynamicIndentation: DynamicIndentation, parentStartLine: number, undecoratedParentStartLine: number, isListItem: boolean, isFirstListItem?: boolean): number {
            const childStartPos = child.getStart(sourceFile);
            const childStartLine = sourceFile.getLineAndCharacterOfPosition(childStartPos).line;
            let undecoratedChildStartLine = childStartLine;
            if (child.decorators) {
                undecoratedChildStartLine = sourceFile.getLineAndCharacterOfPosition(ts.getNonDecoratorTokenPosOfNode(child, sourceFile)).line;
            }
            // if child is a list item - try to get its indentation, only if parent is within the original range.
            let childIndentationAmount = Constants.Unknown;
            if (isListItem && ts.rangeContainsRange(originalRange, parent)) {
                childIndentationAmount = tryComputeIndentationForListItem(childStartPos, child.end, parentStartLine, originalRange, inheritedIndentation);
                if (childIndentationAmount !== Constants.Unknown) {
                    inheritedIndentation = childIndentationAmount;
                }
            }
            // child node is outside the target range - do not dive inside
            if (!ts.rangeOverlapsWithStartEnd(originalRange, child.pos, child.end)) {
                if (child.end < originalRange.pos) {
                    formattingScanner.skipToEndOf(child);
                }
                return inheritedIndentation;
            }
            if (child.getFullWidth() === 0) {
                return inheritedIndentation;
            }
            while (formattingScanner.isOnToken()) {
                // proceed any parent tokens that are located prior to child.getStart()
                const tokenInfo = formattingScanner.readTokenInfo(node);
                if (tokenInfo.token.end > childStartPos) {
                    // stop when formatting scanner advances past the beginning of the child
                    break;
                }
                consumeTokenAndAdvanceScanner(tokenInfo, node, parentDynamicIndentation, node);
            }
            if (!formattingScanner.isOnToken()) {
                return inheritedIndentation;
            }
            // JSX text shouldn't affect indenting
            if (ts.isToken(child) && child.kind !== ts.SyntaxKind.JsxText) {
                // if child node is a token, it does not impact indentation, proceed it using parent indentation scope rules
                const tokenInfo = formattingScanner.readTokenInfo(child);
                ts.Debug.assert(tokenInfo.token.end === child.end, "Token end is child end");
                consumeTokenAndAdvanceScanner(tokenInfo, node, parentDynamicIndentation, child);
                return inheritedIndentation;
            }
            const effectiveParentStartLine = child.kind === ts.SyntaxKind.Decorator ? childStartLine : undecoratedParentStartLine;
            const childIndentation = computeIndentation(child, childStartLine, childIndentationAmount, node, parentDynamicIndentation, effectiveParentStartLine);
            processNode(child, childContextNode, childStartLine, undecoratedChildStartLine, childIndentation.indentation, childIndentation.delta);
            if (child.kind === ts.SyntaxKind.JsxText) {
                const range: ts.TextRange = { pos: child.getStart(), end: child.getEnd() };
                indentMultilineCommentOrJsxText(range, childIndentation.indentation, /*firstLineIsIndented*/ true, /*indentFinalLine*/ false);
            }
            childContextNode = node;
            if (isFirstListItem && parent.kind === ts.SyntaxKind.ArrayLiteralExpression && inheritedIndentation === Constants.Unknown) {
                inheritedIndentation = childIndentation.indentation;
            }
            return inheritedIndentation;
        }
        function processChildNodes(nodes: ts.NodeArray<ts.Node>, parent: ts.Node, parentStartLine: number, parentDynamicIndentation: DynamicIndentation): void {
            ts.Debug.assert(ts.isNodeArray(nodes));
            const listStartToken = getOpenTokenForList(parent, nodes);
            let listDynamicIndentation = parentDynamicIndentation;
            let startLine = parentStartLine;
            if (listStartToken !== ts.SyntaxKind.Unknown) {
                // introduce a new indentation scope for lists (including list start and end tokens)
                while (formattingScanner.isOnToken()) {
                    const tokenInfo = formattingScanner.readTokenInfo(parent);
                    if (tokenInfo.token.end > nodes.pos) {
                        // stop when formatting scanner moves past the beginning of node list
                        break;
                    }
                    else if (tokenInfo.token.kind === listStartToken) {
                        // consume list start token
                        startLine = sourceFile.getLineAndCharacterOfPosition(tokenInfo.token.pos).line;
                        consumeTokenAndAdvanceScanner(tokenInfo, parent, parentDynamicIndentation, parent);
                        let indentationOnListStartToken: number;
                        if (indentationOnLastIndentedLine !== Constants.Unknown) {
                            // scanner just processed list start token so consider last indentation as list indentation
                            // function foo(): { // last indentation was 0, list item will be indented based on this value
                            //   foo: number;
                            // }: {};
                            indentationOnListStartToken = indentationOnLastIndentedLine;
                        }
                        else {
                            const startLinePosition = ts.getLineStartPositionForPosition(tokenInfo.token.pos, sourceFile);
                            indentationOnListStartToken = ts.formatting.SmartIndenter.findFirstNonWhitespaceColumn(startLinePosition, tokenInfo.token.pos, sourceFile, options);
                        }
                        listDynamicIndentation = getDynamicIndentation(parent, parentStartLine, indentationOnListStartToken, options.indentSize!); // TODO: GH#18217
                    }
                    else {
                        // consume any tokens that precede the list as child elements of 'node' using its indentation scope
                        consumeTokenAndAdvanceScanner(tokenInfo, parent, parentDynamicIndentation, parent);
                    }
                }
            }
            let inheritedIndentation = Constants.Unknown;
            for (let i = 0; i < nodes.length; i++) {
                const child = nodes[i];
                inheritedIndentation = processChildNode(child, inheritedIndentation, node, listDynamicIndentation, startLine, startLine, /*isListItem*/ true, /*isFirstListItem*/ i === 0);
            }
            const listEndToken = getCloseTokenForOpenToken(listStartToken);
            if (listEndToken !== ts.SyntaxKind.Unknown && formattingScanner.isOnToken()) {
                let tokenInfo: TokenInfo | undefined = formattingScanner.readTokenInfo(parent);
                if (tokenInfo.token.kind === ts.SyntaxKind.CommaToken && ts.isCallLikeExpression(parent)) {
                    formattingScanner.advance();
                    tokenInfo = formattingScanner.isOnToken() ? formattingScanner.readTokenInfo(parent) : undefined;
                }
                // consume the list end token only if it is still belong to the parent
                // there might be the case when current token matches end token but does not considered as one
                // function (x: function) <--
                // without this check close paren will be interpreted as list end token for function expression which is wrong
                if (tokenInfo && tokenInfo.token.kind === listEndToken && ts.rangeContainsRange(parent, tokenInfo.token)) {
                    // consume list end token
                    consumeTokenAndAdvanceScanner(tokenInfo, parent, listDynamicIndentation, parent, /*isListEndToken*/ true);
                }
            }
        }
        function consumeTokenAndAdvanceScanner(currentTokenInfo: TokenInfo, parent: ts.Node, dynamicIndentation: DynamicIndentation, container: ts.Node, isListEndToken?: boolean): void {
            ts.Debug.assert(ts.rangeContainsRange(parent, currentTokenInfo.token));
            const lastTriviaWasNewLine = formattingScanner.lastTrailingTriviaWasNewLine();
            let indentToken = false;
            if (currentTokenInfo.leadingTrivia) {
                processTrivia(currentTokenInfo.leadingTrivia, parent, childContextNode, dynamicIndentation);
            }
            let lineAction = LineAction.None;
            const isTokenInRange = ts.rangeContainsRange(originalRange, currentTokenInfo.token);
            const tokenStart = sourceFile.getLineAndCharacterOfPosition(currentTokenInfo.token.pos);
            if (isTokenInRange) {
                const rangeHasError = rangeContainsError(currentTokenInfo.token);
                // save previousRange since processRange will overwrite this value with current one
                const savePreviousRange = previousRange;
                lineAction = processRange(currentTokenInfo.token, tokenStart, parent, childContextNode, dynamicIndentation);
                // do not indent comments\token if token range overlaps with some error
                if (!rangeHasError) {
                    if (lineAction === LineAction.None) {
                        // indent token only if end line of previous range does not match start line of the token
                        const prevEndLine = savePreviousRange && sourceFile.getLineAndCharacterOfPosition(savePreviousRange.end).line;
                        indentToken = lastTriviaWasNewLine && tokenStart.line !== prevEndLine;
                    }
                    else {
                        indentToken = lineAction === LineAction.LineAdded;
                    }
                }
            }
            if (currentTokenInfo.trailingTrivia) {
                processTrivia(currentTokenInfo.trailingTrivia, parent, childContextNode, dynamicIndentation);
            }
            if (indentToken) {
                const tokenIndentation = (isTokenInRange && !rangeContainsError(currentTokenInfo.token)) ?
                    dynamicIndentation.getIndentationForToken(tokenStart.line, currentTokenInfo.token.kind, container, !!isListEndToken) :
                    Constants.Unknown;
                let indentNextTokenOrTrivia = true;
                if (currentTokenInfo.leadingTrivia) {
                    const commentIndentation = dynamicIndentation.getIndentationForComment(currentTokenInfo.token.kind, tokenIndentation, container);
                    indentNextTokenOrTrivia = indentTriviaItems(currentTokenInfo.leadingTrivia, commentIndentation, indentNextTokenOrTrivia, item => insertIndentation(item.pos, commentIndentation, /*lineAdded*/ false));
                }
                // indent token only if is it is in target range and does not overlap with any error ranges
                if (tokenIndentation !== Constants.Unknown && indentNextTokenOrTrivia) {
                    insertIndentation(currentTokenInfo.token.pos, tokenIndentation, lineAction === LineAction.LineAdded);
                    lastIndentedLine = tokenStart.line;
                    indentationOnLastIndentedLine = tokenIndentation;
                }
            }
            formattingScanner.advance();
            childContextNode = parent;
        }
    }
    function indentTriviaItems(trivia: TextRangeWithKind[], commentIndentation: number, indentNextTokenOrTrivia: boolean, indentSingleLine: (item: TextRangeWithKind) => void) {
        for (const triviaItem of trivia) {
            const triviaInRange = ts.rangeContainsRange(originalRange, triviaItem);
            switch (triviaItem.kind) {
                case ts.SyntaxKind.MultiLineCommentTrivia:
                    if (triviaInRange) {
                        indentMultilineCommentOrJsxText(triviaItem, commentIndentation, /*firstLineIsIndented*/ !indentNextTokenOrTrivia);
                    }
                    indentNextTokenOrTrivia = false;
                    break;
                case ts.SyntaxKind.SingleLineCommentTrivia:
                    if (indentNextTokenOrTrivia && triviaInRange) {
                        indentSingleLine(triviaItem);
                    }
                    indentNextTokenOrTrivia = false;
                    break;
                case ts.SyntaxKind.NewLineTrivia:
                    indentNextTokenOrTrivia = true;
                    break;
            }
        }
        return indentNextTokenOrTrivia;
    }
    function processTrivia(trivia: TextRangeWithKind[], parent: ts.Node, contextNode: ts.Node, dynamicIndentation: DynamicIndentation): void {
        for (const triviaItem of trivia) {
            if (ts.isComment(triviaItem.kind) && ts.rangeContainsRange(originalRange, triviaItem)) {
                const triviaItemStart = sourceFile.getLineAndCharacterOfPosition(triviaItem.pos);
                processRange(triviaItem, triviaItemStart, parent, contextNode, dynamicIndentation);
            }
        }
    }
    function processRange(range: TextRangeWithKind, rangeStart: ts.LineAndCharacter, parent: ts.Node, contextNode: ts.Node, dynamicIndentation: DynamicIndentation): LineAction {
        const rangeHasError = rangeContainsError(range);
        let lineAction = LineAction.None;
        if (!rangeHasError) {
            if (!previousRange) {
                // trim whitespaces starting from the beginning of the span up to the current line
                const originalStart = sourceFile.getLineAndCharacterOfPosition(originalRange.pos);
                trimTrailingWhitespacesForLines(originalStart.line, rangeStart.line);
            }
            else {
                lineAction =
                    processPair(range, rangeStart.line, parent, previousRange, previousRangeStartLine, previousParent, contextNode, dynamicIndentation);
            }
        }
        previousRange = range;
        previousParent = parent;
        previousRangeStartLine = rangeStart.line;
        return lineAction;
    }
    function processPair(currentItem: TextRangeWithKind, currentStartLine: number, currentParent: ts.Node, previousItem: TextRangeWithKind, previousStartLine: number, previousParent: ts.Node, contextNode: ts.Node, dynamicIndentation: DynamicIndentation): LineAction {
        formattingContext.updateContext(previousItem, previousParent, currentItem, currentParent, contextNode);
        const rules = getRules(formattingContext);
        let trimTrailingWhitespaces = false;
        let lineAction = LineAction.None;
        if (rules) {
            // Apply rules in reverse order so that higher priority rules (which are first in the array)
            // win in a conflict with lower priority rules.
            ts.forEachRight(rules, rule => {
                lineAction = applyRuleEdits(rule, previousItem, previousStartLine, currentItem, currentStartLine);
                switch (lineAction) {
                    case LineAction.LineRemoved:
                        // Handle the case where the next line is moved to be the end of this line.
                        // In this case we don't indent the next line in the next pass.
                        if (currentParent.getStart(sourceFile) === currentItem.pos) {
                            dynamicIndentation.recomputeIndentation(/*lineAddedByFormatting*/ false);
                        }
                        break;
                    case LineAction.LineAdded:
                        // Handle the case where token2 is moved to the new line.
                        // In this case we indent token2 in the next pass but we set
                        // sameLineIndent flag to notify the indenter that the indentation is within the line.
                        if (currentParent.getStart(sourceFile) === currentItem.pos) {
                            dynamicIndentation.recomputeIndentation(/*lineAddedByFormatting*/ true);
                        }
                        break;
                    default:
                        ts.Debug.assert(lineAction === LineAction.None);
                }
                // We need to trim trailing whitespace between the tokens if they were on different lines, and no rule was applied to put them on the same line
                trimTrailingWhitespaces = !(rule.action & ts.formatting.RuleAction.DeleteSpace) && rule.flags !== ts.formatting.RuleFlags.CanDeleteNewLines;
            });
        }
        else {
            trimTrailingWhitespaces = currentItem.kind !== ts.SyntaxKind.EndOfFileToken;
        }
        if (currentStartLine !== previousStartLine && trimTrailingWhitespaces) {
            // We need to trim trailing whitespace between the tokens if they were on different lines, and no rule was applied to put them on the same line
            trimTrailingWhitespacesForLines(previousStartLine, currentStartLine, previousItem);
        }
        return lineAction;
    }
    function insertIndentation(pos: number, indentation: number, lineAdded: boolean | undefined): void {
        const indentationString = getIndentationString(indentation, options);
        if (lineAdded) {
            // new line is added before the token by the formatting rules
            // insert indentation string at the very beginning of the token
            recordReplace(pos, 0, indentationString);
        }
        else {
            const tokenStart = sourceFile.getLineAndCharacterOfPosition(pos);
            const startLinePosition = ts.getStartPositionOfLine(tokenStart.line, sourceFile);
            if (indentation !== characterToColumn(startLinePosition, tokenStart.character) || indentationIsDifferent(indentationString, startLinePosition)) {
                recordReplace(startLinePosition, tokenStart.character, indentationString);
            }
        }
    }
    function characterToColumn(startLinePosition: number, characterInLine: number): number {
        let column = 0;
        for (let i = 0; i < characterInLine; i++) {
            if (sourceFile.text.charCodeAt(startLinePosition + i) === ts.CharacterCodes.tab) {
                column += options.tabSize! - column % options.tabSize!;
            }
            else {
                column++;
            }
        }
        return column;
    }
    function indentationIsDifferent(indentationString: string, startLinePosition: number): boolean {
        return indentationString !== sourceFile.text.substr(startLinePosition, indentationString.length);
    }
    function indentMultilineCommentOrJsxText(commentRange: ts.TextRange, indentation: number, firstLineIsIndented: boolean, indentFinalLine = true) {
        // split comment in lines
        let startLine = sourceFile.getLineAndCharacterOfPosition(commentRange.pos).line;
        const endLine = sourceFile.getLineAndCharacterOfPosition(commentRange.end).line;
        if (startLine === endLine) {
            if (!firstLineIsIndented) {
                // treat as single line comment
                insertIndentation(commentRange.pos, indentation, /*lineAdded*/ false);
            }
            return;
        }
        const parts: ts.TextRange[] = [];
        let startPos = commentRange.pos;
        for (let line = startLine; line < endLine; line++) {
            const endOfLine = ts.getEndLinePosition(line, sourceFile);
            parts.push({ pos: startPos, end: endOfLine });
            startPos = ts.getStartPositionOfLine(line + 1, sourceFile);
        }
        if (indentFinalLine) {
            parts.push({ pos: startPos, end: commentRange.end });
        }
        if (parts.length === 0)
            return;
        const startLinePos = ts.getStartPositionOfLine(startLine, sourceFile);
        const nonWhitespaceColumnInFirstPart = ts.formatting.SmartIndenter.findFirstNonWhitespaceCharacterAndColumn(startLinePos, parts[0].pos, sourceFile, options);
        if (indentation === nonWhitespaceColumnInFirstPart.column) {
            return;
        }
        let startIndex = 0;
        if (firstLineIsIndented) {
            startIndex = 1;
            startLine++;
        }
        // shift all parts on the delta size
        const delta = indentation - nonWhitespaceColumnInFirstPart.column;
        for (let i = startIndex; i < parts.length; i++, startLine++) {
            const startLinePos = ts.getStartPositionOfLine(startLine, sourceFile);
            const nonWhitespaceCharacterAndColumn = i === 0
                ? nonWhitespaceColumnInFirstPart
                : ts.formatting.SmartIndenter.findFirstNonWhitespaceCharacterAndColumn(parts[i].pos, parts[i].end, sourceFile, options);
            const newIndentation = nonWhitespaceCharacterAndColumn.column + delta;
            if (newIndentation > 0) {
                const indentationString = getIndentationString(newIndentation, options);
                recordReplace(startLinePos, nonWhitespaceCharacterAndColumn.character, indentationString);
            }
            else {
                recordDelete(startLinePos, nonWhitespaceCharacterAndColumn.character);
            }
        }
    }
    function trimTrailingWhitespacesForLines(line1: number, line2: number, range?: TextRangeWithKind) {
        for (let line = line1; line < line2; line++) {
            const lineStartPosition = ts.getStartPositionOfLine(line, sourceFile);
            const lineEndPosition = ts.getEndLinePosition(line, sourceFile);
            // do not trim whitespaces in comments or template expression
            if (range && (ts.isComment(range.kind) || ts.isStringOrRegularExpressionOrTemplateLiteral(range.kind)) && range.pos <= lineEndPosition && range.end > lineEndPosition) {
                continue;
            }
            const whitespaceStart = getTrailingWhitespaceStartPosition(lineStartPosition, lineEndPosition);
            if (whitespaceStart !== -1) {
                ts.Debug.assert(whitespaceStart === lineStartPosition || !ts.isWhiteSpaceSingleLine(sourceFile.text.charCodeAt(whitespaceStart - 1)));
                recordDelete(whitespaceStart, lineEndPosition + 1 - whitespaceStart);
            }
        }
    }
    /**
     * @param start The position of the first character in range
     * @param end The position of the last character in range
     */
    function getTrailingWhitespaceStartPosition(start: number, end: number) {
        let pos = end;
        while (pos >= start && ts.isWhiteSpaceSingleLine(sourceFile.text.charCodeAt(pos))) {
            pos--;
        }
        if (pos !== end) {
            return pos + 1;
        }
        return -1;
    }
    /**
     * Trimming will be done for lines after the previous range
     */
    function trimTrailingWhitespacesForRemainingRange() {
        const startPosition = previousRange ? previousRange.end : originalRange.pos;
        const startLine = sourceFile.getLineAndCharacterOfPosition(startPosition).line;
        const endLine = sourceFile.getLineAndCharacterOfPosition(originalRange.end).line;
        trimTrailingWhitespacesForLines(startLine, endLine + 1, previousRange);
    }
    function recordDelete(start: number, len: number) {
        if (len) {
            edits.push(ts.createTextChangeFromStartLength(start, len, ""));
        }
    }
    function recordReplace(start: number, len: number, newText: string) {
        if (len || newText) {
            edits.push(ts.createTextChangeFromStartLength(start, len, newText));
        }
    }
    function recordInsert(start: number, text: string) {
        if (text) {
            edits.push(ts.createTextChangeFromStartLength(start, 0, text));
        }
    }
    function applyRuleEdits(rule: ts.formatting.Rule, previousRange: TextRangeWithKind, previousStartLine: number, currentRange: TextRangeWithKind, currentStartLine: number): LineAction {
        const onLaterLine = currentStartLine !== previousStartLine;
        switch (rule.action) {
            case ts.formatting.RuleAction.StopProcessingSpaceActions:
                // no action required
                return LineAction.None;
            case ts.formatting.RuleAction.DeleteSpace:
                if (previousRange.end !== currentRange.pos) {
                    // delete characters starting from t1.end up to t2.pos exclusive
                    recordDelete(previousRange.end, currentRange.pos - previousRange.end);
                    return onLaterLine ? LineAction.LineRemoved : LineAction.None;
                }
                break;
            case ts.formatting.RuleAction.DeleteToken:
                recordDelete(previousRange.pos, previousRange.end - previousRange.pos);
                break;
            case ts.formatting.RuleAction.InsertNewLine:
                // exit early if we on different lines and rule cannot change number of newlines
                // if line1 and line2 are on subsequent lines then no edits are required - ok to exit
                // if line1 and line2 are separated with more than one newline - ok to exit since we cannot delete extra new lines
                if (rule.flags !== ts.formatting.RuleFlags.CanDeleteNewLines && previousStartLine !== currentStartLine) {
                    return LineAction.None;
                }
                // edit should not be applied if we have one line feed between elements
                const lineDelta = currentStartLine - previousStartLine;
                if (lineDelta !== 1) {
                    recordReplace(previousRange.end, currentRange.pos - previousRange.end, options.newLineCharacter!);
                    return onLaterLine ? LineAction.None : LineAction.LineAdded;
                }
                break;
            case ts.formatting.RuleAction.InsertSpace:
                // exit early if we on different lines and rule cannot change number of newlines
                if (rule.flags !== ts.formatting.RuleFlags.CanDeleteNewLines && previousStartLine !== currentStartLine) {
                    return LineAction.None;
                }
                const posDelta = currentRange.pos - previousRange.end;
                if (posDelta !== 1 || sourceFile.text.charCodeAt(previousRange.end) !== ts.CharacterCodes.space) {
                    recordReplace(previousRange.end, currentRange.pos - previousRange.end, " ");
                    return onLaterLine ? LineAction.LineRemoved : LineAction.None;
                }
                break;
            case ts.formatting.RuleAction.InsertTrailingSemicolon:
                recordInsert(previousRange.end, ";");
        }
        return LineAction.None;
    }
}
/* @internal */
const enum LineAction {
    None,
    LineAdded,
    LineRemoved
}
/**
 * @param precedingToken pass `null` if preceding token was already computed and result was `undefined`.
 */
/* @internal */
export function getRangeOfEnclosingComment(sourceFile: ts.SourceFile, position: number, precedingToken?: ts.Node | null, tokenAtPosition = ts.getTokenAtPosition(sourceFile, position)): ts.CommentRange | undefined {
    const jsdoc = ts.findAncestor(tokenAtPosition, ts.isJSDoc);
    if (jsdoc)
        tokenAtPosition = jsdoc.parent;
    const tokenStart = tokenAtPosition.getStart(sourceFile);
    if (tokenStart <= position && position < tokenAtPosition.getEnd()) {
        return undefined;
    }
    // eslint-disable-next-line no-null/no-null
    precedingToken = precedingToken === null ? undefined : precedingToken === undefined ? ts.findPrecedingToken(position, sourceFile) : precedingToken;
    // Between two consecutive tokens, all comments are either trailing on the former
    // or leading on the latter (and none are in both lists).
    const trailingRangesOfPreviousToken = precedingToken && ts.getTrailingCommentRanges(sourceFile.text, precedingToken.end);
    const leadingCommentRangesOfNextToken = ts.getLeadingCommentRangesOfNode(tokenAtPosition, sourceFile);
    const commentRanges = ts.concatenate(trailingRangesOfPreviousToken, leadingCommentRangesOfNextToken);
    return commentRanges && ts.find(commentRanges, range => ts.rangeContainsPositionExclusive(range, position) ||
        // The end marker of a single-line comment does not include the newline character.
        // With caret at `^`, in the following case, we are inside a comment (^ denotes the cursor position):
        //
        //    // asdf   ^\n
        //
        // But for closed multi-line comments, we don't want to be inside the comment in the following case:
        //
        //    /* asdf */^
        //
        // However, unterminated multi-line comments *do* contain their end.
        //
        // Internally, we represent the end of the comment at the newline and closing '/', respectively.
        //
        position === range.end && (range.kind === ts.SyntaxKind.SingleLineCommentTrivia || position === sourceFile.getFullWidth()));
}
/* @internal */
function getOpenTokenForList(node: ts.Node, list: readonly ts.Node[]) {
    switch (node.kind) {
        case ts.SyntaxKind.Constructor:
        case ts.SyntaxKind.FunctionDeclaration:
        case ts.SyntaxKind.FunctionExpression:
        case ts.SyntaxKind.MethodDeclaration:
        case ts.SyntaxKind.MethodSignature:
        case ts.SyntaxKind.ArrowFunction:
            if ((<ts.FunctionDeclaration>node).typeParameters === list) {
                return ts.SyntaxKind.LessThanToken;
            }
            else if ((<ts.FunctionDeclaration>node).parameters === list) {
                return ts.SyntaxKind.OpenParenToken;
            }
            break;
        case ts.SyntaxKind.CallExpression:
        case ts.SyntaxKind.NewExpression:
            if ((<ts.CallExpression>node).typeArguments === list) {
                return ts.SyntaxKind.LessThanToken;
            }
            else if ((<ts.CallExpression>node).arguments === list) {
                return ts.SyntaxKind.OpenParenToken;
            }
            break;
        case ts.SyntaxKind.TypeReference:
            if ((<ts.TypeReferenceNode>node).typeArguments === list) {
                return ts.SyntaxKind.LessThanToken;
            }
            break;
        case ts.SyntaxKind.TypeLiteral:
            return ts.SyntaxKind.OpenBraceToken;
    }
    return ts.SyntaxKind.Unknown;
}
/* @internal */
function getCloseTokenForOpenToken(kind: ts.SyntaxKind) {
    switch (kind) {
        case ts.SyntaxKind.OpenParenToken:
            return ts.SyntaxKind.CloseParenToken;
        case ts.SyntaxKind.LessThanToken:
            return ts.SyntaxKind.GreaterThanToken;
        case ts.SyntaxKind.OpenBraceToken:
            return ts.SyntaxKind.CloseBraceToken;
    }
    return ts.SyntaxKind.Unknown;
}
/* @internal */
let internedSizes: {
    tabSize: number;
    indentSize: number;
};
/* @internal */
let internedTabsIndentation: string[] | undefined;
/* @internal */
let internedSpacesIndentation: string[] | undefined;
/* @internal */
export function getIndentationString(indentation: number, options: ts.EditorSettings): string {
    // reset interned strings if FormatCodeOptions were changed
    const resetInternedStrings = !internedSizes || (internedSizes.tabSize !== options.tabSize || internedSizes.indentSize !== options.indentSize);
    if (resetInternedStrings) {
        internedSizes = { tabSize: options.tabSize!, indentSize: options.indentSize! };
        internedTabsIndentation = internedSpacesIndentation = undefined;
    }
    if (!options.convertTabsToSpaces) {
        const tabs = Math.floor(indentation / options.tabSize!);
        const spaces = indentation - tabs * options.tabSize!;
        let tabString: string;
        if (!internedTabsIndentation) {
            internedTabsIndentation = [];
        }
        if (internedTabsIndentation[tabs] === undefined) {
            internedTabsIndentation[tabs] = tabString = ts.repeatString("\t", tabs);
        }
        else {
            tabString = internedTabsIndentation[tabs];
        }
        return spaces ? tabString + ts.repeatString(" ", spaces) : tabString;
    }
    else {
        let spacesString: string;
        const quotient = Math.floor(indentation / options.indentSize!);
        const remainder = indentation % options.indentSize!;
        if (!internedSpacesIndentation) {
            internedSpacesIndentation = [];
        }
        if (internedSpacesIndentation[quotient] === undefined) {
            spacesString = ts.repeatString(" ", options.indentSize! * quotient);
            internedSpacesIndentation[quotient] = spacesString;
        }
        else {
            spacesString = internedSpacesIndentation[quotient];
        }
        return remainder ? spacesString + ts.repeatString(" ", remainder) : spacesString;
    }
}
