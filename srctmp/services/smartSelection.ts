import * as ts from "./ts";
/* @internal */
export function getSmartSelectionRange(pos: number, sourceFile: ts.SourceFile): ts.SelectionRange {
    let selectionRange: ts.SelectionRange = {
        textSpan: ts.createTextSpanFromBounds(sourceFile.getFullStart(), sourceFile.getEnd())
    };
    let parentNode: ts.Node = sourceFile;
    outer: while (true) {
        const children = getSelectionChildren(parentNode);
        if (!children.length)
            break;
        for (let i = 0; i < children.length; i++) {
            const prevNode: ts.Node | undefined = children[i - 1];
            const node: ts.Node = children[i];
            const nextNode: ts.Node | undefined = children[i + 1];
            if (node.getStart(sourceFile) > pos) {
                break outer;
            }
            if (positionShouldSnapToNode(sourceFile, pos, node)) {
                // 1. Blocks are effectively redundant with SyntaxLists.
                // 2. TemplateSpans, along with the SyntaxLists containing them, are a somewhat unintuitive grouping
                //    of things that should be considered independently.
                // 3. A VariableStatement’s children are just a VaraiableDeclarationList and a semicolon.
                // 4. A lone VariableDeclaration in a VaraibleDeclaration feels redundant with the VariableStatement.
                //
                // Dive in without pushing a selection range.
                if (ts.isBlock(node)
                    || ts.isTemplateSpan(node) || ts.isTemplateHead(node) || ts.isTemplateTail(node)
                    || prevNode && ts.isTemplateHead(prevNode)
                    || ts.isVariableDeclarationList(node) && ts.isVariableStatement(parentNode)
                    || ts.isSyntaxList(node) && ts.isVariableDeclarationList(parentNode)
                    || ts.isVariableDeclaration(node) && ts.isSyntaxList(parentNode) && children.length === 1) {
                    parentNode = node;
                    break;
                }
                // Synthesize a stop for '${ ... }' since '${' and '}' actually belong to siblings.
                if (ts.isTemplateSpan(parentNode) && nextNode && ts.isTemplateMiddleOrTemplateTail(nextNode)) {
                    const start = node.getFullStart() - "${".length;
                    const end = nextNode.getStart() + "}".length;
                    pushSelectionRange(start, end);
                }
                // Blocks with braces, brackets, parens, or JSX tags on separate lines should be
                // selected from open to close, including whitespace but not including the braces/etc. themselves.
                const isBetweenMultiLineBookends = ts.isSyntaxList(node)
                    && isListOpener(prevNode)
                    && isListCloser(nextNode)
                    && !ts.positionsAreOnSameLine(prevNode.getStart(), nextNode.getStart(), sourceFile);
                const jsDocCommentStart = ts.hasJSDocNodes(node) && node.jsDoc![0].getStart();
                const start = isBetweenMultiLineBookends ? prevNode.getEnd() : node.getStart();
                const end = isBetweenMultiLineBookends ? nextNode.getStart() : node.getEnd();
                if (ts.isNumber(jsDocCommentStart)) {
                    pushSelectionRange(jsDocCommentStart, end);
                }
                pushSelectionRange(start, end);
                // String literals should have a stop both inside and outside their quotes.
                if (ts.isStringLiteral(node) || ts.isTemplateLiteral(node)) {
                    pushSelectionRange(start + 1, end - 1);
                }
                parentNode = node;
                break;
            }
            // If we made it to the end of the for loop, we’re done.
            // In practice, I’ve only seen this happen at the very end
            // of a SourceFile.
            if (i === children.length - 1) {
                break outer;
            }
        }
    }
    return selectionRange;
    function pushSelectionRange(start: number, end: number): void {
        // Skip empty ranges
        if (start !== end) {
            const textSpan = ts.createTextSpanFromBounds(start, end);
            if (!selectionRange || (
            // Skip ranges that are identical to the parent
            !ts.textSpansEqual(textSpan, selectionRange.textSpan) &&
                // Skip ranges that don’t contain the original position
                ts.textSpanIntersectsWithPosition(textSpan, pos))) {
                selectionRange = { textSpan, ...selectionRange && { parent: selectionRange } };
            }
        }
    }
}
/**
 * Like `ts.positionBelongsToNode`, except positions immediately after nodes
 * count too, unless that position belongs to the next node. In effect, makes
 * selections able to snap to preceding tokens when the cursor is on the tail
 * end of them with only whitespace ahead.
 * @param sourceFile The source file containing the nodes.
 * @param pos The position to check.
 * @param node The candidate node to snap to.
 */
/* @internal */
function positionShouldSnapToNode(sourceFile: ts.SourceFile, pos: number, node: ts.Node) {
    // Can’t use 'ts.positionBelongsToNode()' here because it cleverly accounts
    // for missing nodes, which can’t really be considered when deciding what
    // to select.
    ts.Debug.assert(node.pos <= pos);
    if (pos < node.end) {
        return true;
    }
    const nodeEnd = node.getEnd();
    if (nodeEnd === pos) {
        return ts.getTouchingPropertyName(sourceFile, pos).pos < node.end;
    }
    return false;
}
/* @internal */
const isImport = ts.or(ts.isImportDeclaration, ts.isImportEqualsDeclaration);
/**
 * Gets the children of a node to be considered for selection ranging,
 * transforming them into an artificial tree according to their intuitive
 * grouping where no grouping actually exists in the parse tree. For example,
 * top-level imports are grouped into their own SyntaxList so they can be
 * selected all together, even though in the AST they’re just siblings of each
 * other as well as of other top-level statements and declarations.
 */
/* @internal */
function getSelectionChildren(node: ts.Node): readonly ts.Node[] {
    // Group top-level imports
    if (ts.isSourceFile(node)) {
        return groupChildren(node.getChildAt(0).getChildren(), isImport);
    }
    // Mapped types _look_ like ObjectTypes with a single member,
    // but in fact don’t contain a SyntaxList or a node containing
    // the “key/value” pair like ObjectTypes do, but it seems intuitive
    // that the selection would snap to those points. The philosophy
    // of choosing a selection range is not so much about what the
    // syntax currently _is_ as what the syntax might easily become
    // if the user is making a selection; e.g., we synthesize a selection
    // around the “key/value” pair not because there’s a node there, but
    // because it allows the mapped type to become an object type with a
    // few keystrokes.
    if (ts.isMappedTypeNode(node)) {
        const [openBraceToken, ...children] = node.getChildren();
        const closeBraceToken = ts.Debug.assertDefined(children.pop());
        ts.Debug.assertEqual(openBraceToken.kind, ts.SyntaxKind.OpenBraceToken);
        ts.Debug.assertEqual(closeBraceToken.kind, ts.SyntaxKind.CloseBraceToken);
        // Group `-/+readonly` and `-/+?`
        const groupedWithPlusMinusTokens = groupChildren(children, child => child === node.readonlyToken || child.kind === ts.SyntaxKind.ReadonlyKeyword ||
            child === node.questionToken || child.kind === ts.SyntaxKind.QuestionToken);
        // Group type parameter with surrounding brackets
        const groupedWithBrackets = groupChildren(groupedWithPlusMinusTokens, ({ kind }) => kind === ts.SyntaxKind.OpenBracketToken ||
            kind === ts.SyntaxKind.TypeParameter ||
            kind === ts.SyntaxKind.CloseBracketToken);
        return [
            openBraceToken,
            // Pivot on `:`
            createSyntaxList(splitChildren(groupedWithBrackets, ({ kind }) => kind === ts.SyntaxKind.ColonToken)),
            closeBraceToken,
        ];
    }
    // Group modifiers and property name, then pivot on `:`.
    if (ts.isPropertySignature(node)) {
        const children = groupChildren(node.getChildren(), child => child === node.name || ts.contains(node.modifiers, child));
        return splitChildren(children, ({ kind }) => kind === ts.SyntaxKind.ColonToken);
    }
    // Group the parameter name with its `...`, then that group with its `?`, then pivot on `=`.
    if (ts.isParameter(node)) {
        const groupedDotDotDotAndName = groupChildren(node.getChildren(), child => child === node.dotDotDotToken || child === node.name);
        const groupedWithQuestionToken = groupChildren(groupedDotDotDotAndName, child => child === groupedDotDotDotAndName[0] || child === node.questionToken);
        return splitChildren(groupedWithQuestionToken, ({ kind }) => kind === ts.SyntaxKind.EqualsToken);
    }
    // Pivot on '='
    if (ts.isBindingElement(node)) {
        return splitChildren(node.getChildren(), ({ kind }) => kind === ts.SyntaxKind.EqualsToken);
    }
    return node.getChildren();
}
/**
 * Groups sibling nodes together into their own SyntaxList if they
 * a) are adjacent, AND b) match a predicate function.
 */
/* @internal */
function groupChildren(children: ts.Node[], groupOn: (child: ts.Node) => boolean): ts.Node[] {
    const result: ts.Node[] = [];
    let group: ts.Node[] | undefined;
    for (const child of children) {
        if (groupOn(child)) {
            group = group || [];
            group.push(child);
        }
        else {
            if (group) {
                result.push(createSyntaxList(group));
                group = undefined;
            }
            result.push(child);
        }
    }
    if (group) {
        result.push(createSyntaxList(group));
    }
    return result;
}
/**
 * Splits sibling nodes into up to four partitions:
 * 1) everything left of the first node matched by `pivotOn`,
 * 2) the first node matched by `pivotOn`,
 * 3) everything right of the first node matched by `pivotOn`,
 * 4) a trailing semicolon, if `separateTrailingSemicolon` is enabled.
 * The left and right groups, if not empty, will each be grouped into their own containing SyntaxList.
 * @param children The sibling nodes to split.
 * @param pivotOn The predicate function to match the node to be the pivot. The first node that matches
 * the predicate will be used; any others that may match will be included into the right-hand group.
 * @param separateTrailingSemicolon If the last token is a semicolon, it will be returned as a separate
 * child rather than be included in the right-hand group.
 */
/* @internal */
function splitChildren(children: ts.Node[], pivotOn: (child: ts.Node) => boolean, separateTrailingSemicolon = true): ts.Node[] {
    if (children.length < 2) {
        return children;
    }
    const splitTokenIndex = ts.findIndex(children, pivotOn);
    if (splitTokenIndex === -1) {
        return children;
    }
    const leftChildren = children.slice(0, splitTokenIndex);
    const splitToken = children[splitTokenIndex];
    const lastToken = ts.last(children);
    const separateLastToken = separateTrailingSemicolon && lastToken.kind === ts.SyntaxKind.SemicolonToken;
    const rightChildren = children.slice(splitTokenIndex + 1, separateLastToken ? children.length - 1 : undefined);
    const result = ts.compact([
        leftChildren.length ? createSyntaxList(leftChildren) : undefined,
        splitToken,
        rightChildren.length ? createSyntaxList(rightChildren) : undefined,
    ]);
    return separateLastToken ? result.concat(lastToken) : result;
}
/* @internal */
function createSyntaxList(children: ts.Node[]): ts.SyntaxList {
    ts.Debug.assertGreaterThanOrEqual(children.length, 1);
    const syntaxList = (ts.createNode(ts.SyntaxKind.SyntaxList, children[0].pos, ts.last(children).end) as ts.SyntaxList);
    syntaxList._children = children;
    return syntaxList;
}
/* @internal */
function isListOpener(token: ts.Node | undefined): token is ts.Node {
    const kind = token && token.kind;
    return kind === ts.SyntaxKind.OpenBraceToken
        || kind === ts.SyntaxKind.OpenBracketToken
        || kind === ts.SyntaxKind.OpenParenToken
        || kind === ts.SyntaxKind.JsxOpeningElement;
}
/* @internal */
function isListCloser(token: ts.Node | undefined): token is ts.Node {
    const kind = token && token.kind;
    return kind === ts.SyntaxKind.CloseBraceToken
        || kind === ts.SyntaxKind.CloseBracketToken
        || kind === ts.SyntaxKind.CloseParenToken
        || kind === ts.SyntaxKind.JsxClosingElement;
}
