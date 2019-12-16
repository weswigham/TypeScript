/* @internal */
namespace ts.OutliningElementsCollector {
    export function collectElements(sourceFile: ts.SourceFile, cancellationToken: ts.CancellationToken): ts.OutliningSpan[] {
        const res: ts.OutliningSpan[] = [];
        addNodeOutliningSpans(sourceFile, cancellationToken, res);
        addRegionOutliningSpans(sourceFile, res);
        return res.sort((span1, span2) => span1.textSpan.start - span2.textSpan.start);
    }
    function addNodeOutliningSpans(sourceFile: ts.SourceFile, cancellationToken: ts.CancellationToken, out: ts.Push<ts.OutliningSpan>): void {
        let depthRemaining = 40;
        let current = 0;
        const statements = sourceFile.statements;
        const n = statements.length;
        while (current < n) {
            while (current < n && !ts.isAnyImportSyntax(statements[current])) {
                visitNonImportNode(statements[current]);
                current++;
            }
            if (current === n)
                break;
            const firstImport = current;
            while (current < n && ts.isAnyImportSyntax(statements[current])) {
                addOutliningForLeadingCommentsForNode(statements[current], sourceFile, cancellationToken, out);
                current++;
            }
            const lastImport = current - 1;
            if (lastImport !== firstImport) {
                out.push(createOutliningSpanFromBounds(ts.findChildOfKind(statements[firstImport], ts.SyntaxKind.ImportKeyword, sourceFile)!.getStart(sourceFile), statements[lastImport].getEnd(), ts.OutliningSpanKind.Imports));
            }
        }
        function visitNonImportNode(n: ts.Node) {
            if (depthRemaining === 0)
                return;
            cancellationToken.throwIfCancellationRequested();
            if (ts.isDeclaration(n)) {
                addOutliningForLeadingCommentsForNode(n, sourceFile, cancellationToken, out);
            }
            if (isFunctionExpressionAssignedToVariable(n)) {
                addOutliningForLeadingCommentsForNode(n.parent.parent.parent, sourceFile, cancellationToken, out);
            }
            const span = getOutliningSpanForNode(n, sourceFile);
            if (span)
                out.push(span);
            depthRemaining--;
            if (ts.isIfStatement(n) && n.elseStatement && ts.isIfStatement(n.elseStatement)) {
                // Consider an 'else if' to be on the same depth as the 'if'.
                visitNonImportNode(n.expression);
                visitNonImportNode(n.thenStatement);
                depthRemaining++;
                visitNonImportNode(n.elseStatement);
                depthRemaining--;
            }
            else {
                n.forEachChild(visitNonImportNode);
            }
            depthRemaining++;
        }
        function isFunctionExpressionAssignedToVariable(n: ts.Node) {
            if (!ts.isFunctionExpression(n) && !ts.isArrowFunction(n)) {
                return false;
            }
            const ancestor = ts.findAncestor(n, ts.isVariableStatement);
            return !!ancestor && ts.getSingleInitializerOfVariableStatementOrPropertyDeclaration(ancestor) === n;
        }
    }
    function addRegionOutliningSpans(sourceFile: ts.SourceFile, out: ts.Push<ts.OutliningSpan>): void {
        const regions: ts.OutliningSpan[] = [];
        const lineStarts = sourceFile.getLineStarts();
        for (const currentLineStart of lineStarts) {
            const lineEnd = sourceFile.getLineEndOfPosition(currentLineStart);
            const lineText = sourceFile.text.substring(currentLineStart, lineEnd);
            const result = isRegionDelimiter(lineText);
            if (!result || ts.isInComment(sourceFile, currentLineStart)) {
                continue;
            }
            if (!result[1]) {
                const span = ts.createTextSpanFromBounds(sourceFile.text.indexOf("//", currentLineStart), lineEnd);
                regions.push(createOutliningSpan(span, ts.OutliningSpanKind.Region, span, /*autoCollapse*/ false, result[2] || "#region"));
            }
            else {
                const region = regions.pop();
                if (region) {
                    region.textSpan.length = lineEnd - region.textSpan.start;
                    region.hintSpan.length = lineEnd - region.textSpan.start;
                    out.push(region);
                }
            }
        }
    }
    const regionDelimiterRegExp = /^\s*\/\/\s*#(end)?region(?:\s+(.*))?(?:\r)?$/;
    function isRegionDelimiter(lineText: string) {
        return regionDelimiterRegExp.exec(lineText);
    }
    function addOutliningForLeadingCommentsForNode(n: ts.Node, sourceFile: ts.SourceFile, cancellationToken: ts.CancellationToken, out: ts.Push<ts.OutliningSpan>): void {
        const comments = ts.getLeadingCommentRangesOfNode(n, sourceFile);
        if (!comments)
            return;
        let firstSingleLineCommentStart = -1;
        let lastSingleLineCommentEnd = -1;
        let singleLineCommentCount = 0;
        const sourceText = sourceFile.getFullText();
        for (const { kind, pos, end } of comments) {
            cancellationToken.throwIfCancellationRequested();
            switch (kind) {
                case ts.SyntaxKind.SingleLineCommentTrivia:
                    // never fold region delimiters into single-line comment regions
                    const commentText = sourceText.slice(pos, end);
                    if (isRegionDelimiter(commentText)) {
                        combineAndAddMultipleSingleLineComments();
                        singleLineCommentCount = 0;
                        break;
                    }
                    // For single line comments, combine consecutive ones (2 or more) into
                    // a single span from the start of the first till the end of the last
                    if (singleLineCommentCount === 0) {
                        firstSingleLineCommentStart = pos;
                    }
                    lastSingleLineCommentEnd = end;
                    singleLineCommentCount++;
                    break;
                case ts.SyntaxKind.MultiLineCommentTrivia:
                    combineAndAddMultipleSingleLineComments();
                    out.push(createOutliningSpanFromBounds(pos, end, ts.OutliningSpanKind.Comment));
                    singleLineCommentCount = 0;
                    break;
                default:
                    ts.Debug.assertNever(kind);
            }
        }
        combineAndAddMultipleSingleLineComments();
        function combineAndAddMultipleSingleLineComments(): void {
            // Only outline spans of two or more consecutive single line comments
            if (singleLineCommentCount > 1) {
                out.push(createOutliningSpanFromBounds(firstSingleLineCommentStart, lastSingleLineCommentEnd, ts.OutliningSpanKind.Comment));
            }
        }
    }
    function createOutliningSpanFromBounds(pos: number, end: number, kind: ts.OutliningSpanKind): ts.OutliningSpan {
        return createOutliningSpan(ts.createTextSpanFromBounds(pos, end), kind);
    }
    function getOutliningSpanForNode(n: ts.Node, sourceFile: ts.SourceFile): ts.OutliningSpan | undefined {
        switch (n.kind) {
            case ts.SyntaxKind.Block:
                if (ts.isFunctionLike(n.parent)) {
                    return functionSpan(n.parent, (n as ts.Block), sourceFile);
                }
                // Check if the block is standalone, or 'attached' to some parent statement.
                // If the latter, we want to collapse the block, but consider its hint span
                // to be the entire span of the parent.
                switch (n.parent.kind) {
                    case ts.SyntaxKind.DoStatement:
                    case ts.SyntaxKind.ForInStatement:
                    case ts.SyntaxKind.ForOfStatement:
                    case ts.SyntaxKind.ForStatement:
                    case ts.SyntaxKind.IfStatement:
                    case ts.SyntaxKind.WhileStatement:
                    case ts.SyntaxKind.WithStatement:
                    case ts.SyntaxKind.CatchClause:
                        return spanForNode(n.parent);
                    case ts.SyntaxKind.TryStatement:
                        // Could be the try-block, or the finally-block.
                        const tryStatement = (<ts.TryStatement>n.parent);
                        if (tryStatement.tryBlock === n) {
                            return spanForNode(n.parent);
                        }
                        else if (tryStatement.finallyBlock === n) {
                            return spanForNode((ts.findChildOfKind(tryStatement, ts.SyntaxKind.FinallyKeyword, sourceFile)!));
                        }
                    // falls through
                    default:
                        // Block was a standalone block.  In this case we want to only collapse
                        // the span of the block, independent of any parent span.
                        return createOutliningSpan(ts.createTextSpanFromNode(n, sourceFile), ts.OutliningSpanKind.Code);
                }
            case ts.SyntaxKind.ModuleBlock:
                return spanForNode(n.parent);
            case ts.SyntaxKind.ClassDeclaration:
            case ts.SyntaxKind.ClassExpression:
            case ts.SyntaxKind.InterfaceDeclaration:
            case ts.SyntaxKind.EnumDeclaration:
            case ts.SyntaxKind.CaseBlock:
                return spanForNode(n);
            case ts.SyntaxKind.ObjectLiteralExpression:
                return spanForObjectOrArrayLiteral(n);
            case ts.SyntaxKind.ArrayLiteralExpression:
                return spanForObjectOrArrayLiteral(n, ts.SyntaxKind.OpenBracketToken);
            case ts.SyntaxKind.JsxElement:
                return spanForJSXElement((<ts.JsxElement>n));
            case ts.SyntaxKind.JsxFragment:
                return spanForJSXFragment((<ts.JsxFragment>n));
            case ts.SyntaxKind.JsxSelfClosingElement:
            case ts.SyntaxKind.JsxOpeningElement:
                return spanForJSXAttributes((<ts.JsxOpeningLikeElement>n).attributes);
            case ts.SyntaxKind.TemplateExpression:
            case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
                return spanForTemplateLiteral((<ts.TemplateExpression | ts.NoSubstitutionTemplateLiteral>n));
        }
        function spanForJSXElement(node: ts.JsxElement): ts.OutliningSpan | undefined {
            const textSpan = ts.createTextSpanFromBounds(node.openingElement.getStart(sourceFile), node.closingElement.getEnd());
            const tagName = node.openingElement.tagName.getText(sourceFile);
            const bannerText = "<" + tagName + ">...</" + tagName + ">";
            return createOutliningSpan(textSpan, ts.OutliningSpanKind.Code, textSpan, /*autoCollapse*/ false, bannerText);
        }
        function spanForJSXFragment(node: ts.JsxFragment): ts.OutliningSpan | undefined {
            const textSpan = ts.createTextSpanFromBounds(node.openingFragment.getStart(sourceFile), node.closingFragment.getEnd());
            const bannerText = "<>...</>";
            return createOutliningSpan(textSpan, ts.OutliningSpanKind.Code, textSpan, /*autoCollapse*/ false, bannerText);
        }
        function spanForJSXAttributes(node: ts.JsxAttributes): ts.OutliningSpan | undefined {
            if (node.properties.length === 0) {
                return undefined;
            }
            return createOutliningSpanFromBounds(node.getStart(sourceFile), node.getEnd(), ts.OutliningSpanKind.Code);
        }
        function spanForTemplateLiteral(node: ts.TemplateExpression | ts.NoSubstitutionTemplateLiteral) {
            if (node.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral && node.text.length === 0) {
                return undefined;
            }
            return createOutliningSpanFromBounds(node.getStart(sourceFile), node.getEnd(), ts.OutliningSpanKind.Code);
        }
        function spanForObjectOrArrayLiteral(node: ts.Node, open: ts.SyntaxKind.OpenBraceToken | ts.SyntaxKind.OpenBracketToken = ts.SyntaxKind.OpenBraceToken): ts.OutliningSpan | undefined {
            // If the block has no leading keywords and is inside an array literal or call expression,
            // we only want to collapse the span of the block.
            // Otherwise, the collapsed section will include the end of the previous line.
            return spanForNode(node, /*autoCollapse*/ false, /*useFullStart*/ !ts.isArrayLiteralExpression(node.parent) && !ts.isCallExpression(node.parent), open);
        }
        function spanForNode(hintSpanNode: ts.Node, autoCollapse = false, useFullStart = true, open: ts.SyntaxKind.OpenBraceToken | ts.SyntaxKind.OpenBracketToken = ts.SyntaxKind.OpenBraceToken, close: ts.SyntaxKind = open === ts.SyntaxKind.OpenBraceToken ? ts.SyntaxKind.CloseBraceToken : ts.SyntaxKind.CloseBracketToken): ts.OutliningSpan | undefined {
            const openToken = ts.findChildOfKind(n, open, sourceFile);
            const closeToken = ts.findChildOfKind(n, close, sourceFile);
            return openToken && closeToken && spanBetweenTokens(openToken, closeToken, hintSpanNode, sourceFile, autoCollapse, useFullStart);
        }
    }
    function functionSpan(node: ts.FunctionLike, body: ts.Block, sourceFile: ts.SourceFile): ts.OutliningSpan | undefined {
        const openToken = ts.isNodeArrayMultiLine(node.parameters, sourceFile)
            ? ts.findChildOfKind(node, ts.SyntaxKind.OpenParenToken, sourceFile)
            : ts.findChildOfKind(body, ts.SyntaxKind.OpenBraceToken, sourceFile);
        const closeToken = ts.findChildOfKind(body, ts.SyntaxKind.CloseBraceToken, sourceFile);
        return openToken && closeToken && spanBetweenTokens(openToken, closeToken, node, sourceFile, /*autoCollapse*/ node.kind !== ts.SyntaxKind.ArrowFunction);
    }
    function spanBetweenTokens(openToken: ts.Node, closeToken: ts.Node, hintSpanNode: ts.Node, sourceFile: ts.SourceFile, autoCollapse = false, useFullStart = true): ts.OutliningSpan {
        const textSpan = ts.createTextSpanFromBounds(useFullStart ? openToken.getFullStart() : openToken.getStart(sourceFile), closeToken.getEnd());
        return createOutliningSpan(textSpan, ts.OutliningSpanKind.Code, ts.createTextSpanFromNode(hintSpanNode, sourceFile), autoCollapse);
    }
    function createOutliningSpan(textSpan: ts.TextSpan, kind: ts.OutliningSpanKind, hintSpan: ts.TextSpan = textSpan, autoCollapse = false, bannerText = "..."): ts.OutliningSpan {
        return { textSpan, kind, hintSpan, bannerText, autoCollapse };
    }
}
