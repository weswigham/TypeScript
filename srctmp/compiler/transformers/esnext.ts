import * as ts from "../ts";
/*@internal*/
export function transformESNext(context: ts.TransformationContext) {
    const { hoistVariableDeclaration, } = context;
    return ts.chainBundle(transformSourceFile);
    function transformSourceFile(node: ts.SourceFile) {
        if (node.isDeclarationFile) {
            return node;
        }
        return ts.visitEachChild(node, visitor, context);
    }
    function visitor(node: ts.Node): ts.VisitResult<ts.Node> {
        if ((node.transformFlags & ts.TransformFlags.ContainsESNext) === 0) {
            return node;
        }
        switch (node.kind) {
            case ts.SyntaxKind.PropertyAccessExpression:
            case ts.SyntaxKind.ElementAccessExpression:
            case ts.SyntaxKind.CallExpression:
                if (node.flags & ts.NodeFlags.OptionalChain) {
                    const updated = visitOptionalExpression((node as ts.OptionalChain), /*captureThisArg*/ false, /*isDelete*/ false);
                    ts.Debug.assertNotNode(updated, ts.isSyntheticReference);
                    return updated;
                }
                return ts.visitEachChild(node, visitor, context);
            case ts.SyntaxKind.BinaryExpression:
                if ((<ts.BinaryExpression>node).operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) {
                    return transformNullishCoalescingExpression((<ts.BinaryExpression>node));
                }
                return ts.visitEachChild(node, visitor, context);
            case ts.SyntaxKind.DeleteExpression:
                return visitDeleteExpression((node as ts.DeleteExpression));
            default:
                return ts.visitEachChild(node, visitor, context);
        }
    }
    function flattenChain(chain: ts.OptionalChain) {
        const links: ts.OptionalChain[] = [chain];
        while (!chain.questionDotToken && !ts.isTaggedTemplateExpression(chain)) {
            chain = ts.cast(chain.expression, ts.isOptionalChain);
            links.unshift(chain);
        }
        return { expression: chain.expression, chain: links };
    }
    function visitNonOptionalParenthesizedExpression(node: ts.ParenthesizedExpression, captureThisArg: boolean, isDelete: boolean): ts.Expression {
        const expression = visitNonOptionalExpression(node.expression, captureThisArg, isDelete);
        if (ts.isSyntheticReference(expression)) {
            // `(a.b)` -> { expression `((_a = a).b)`, thisArg: `_a` }
            // `(a[b])` -> { expression `((_a = a)[b])`, thisArg: `_a` }
            return ts.createSyntheticReferenceExpression(ts.updateParen(node, expression.expression), expression.thisArg);
        }
        return ts.updateParen(node, expression);
    }
    function visitNonOptionalPropertyOrElementAccessExpression(node: ts.AccessExpression, captureThisArg: boolean, isDelete: boolean): ts.Expression {
        if (ts.isOptionalChain(node)) {
            // If `node` is an optional chain, then it is the outermost chain of an optional expression.
            return visitOptionalExpression(node, captureThisArg, isDelete);
        }
        let expression: ts.Expression = ts.visitNode(node.expression, visitor, ts.isExpression);
        ts.Debug.assertNotNode(expression, ts.isSyntheticReference);
        let thisArg: ts.Expression | undefined;
        if (captureThisArg) {
            if (shouldCaptureInTempVariable(expression)) {
                thisArg = ts.createTempVariable(hoistVariableDeclaration);
                expression = ts.createAssignment(thisArg, expression);
            }
            else {
                thisArg = expression;
            }
        }
        expression = node.kind === ts.SyntaxKind.PropertyAccessExpression
            ? ts.updatePropertyAccess(node, expression, ts.visitNode(node.name, visitor, ts.isIdentifier))
            : ts.updateElementAccess(node, expression, ts.visitNode(node.argumentExpression, visitor, ts.isExpression));
        return thisArg ? ts.createSyntheticReferenceExpression(expression, thisArg) : expression;
    }
    function visitNonOptionalCallExpression(node: ts.CallExpression, captureThisArg: boolean): ts.Expression {
        if (ts.isOptionalChain(node)) {
            // If `node` is an optional chain, then it is the outermost chain of an optional expression.
            return visitOptionalExpression(node, captureThisArg, /*isDelete*/ false);
        }
        return ts.visitEachChild(node, visitor, context);
    }
    function visitNonOptionalExpression(node: ts.Expression, captureThisArg: boolean, isDelete: boolean): ts.Expression {
        switch (node.kind) {
            case ts.SyntaxKind.ParenthesizedExpression: return visitNonOptionalParenthesizedExpression((node as ts.ParenthesizedExpression), captureThisArg, isDelete);
            case ts.SyntaxKind.PropertyAccessExpression:
            case ts.SyntaxKind.ElementAccessExpression: return visitNonOptionalPropertyOrElementAccessExpression((node as ts.AccessExpression), captureThisArg, isDelete);
            case ts.SyntaxKind.CallExpression: return visitNonOptionalCallExpression((node as ts.CallExpression), captureThisArg);
            default: return ts.visitNode(node, visitor, ts.isExpression);
        }
    }
    function visitOptionalExpression(node: ts.OptionalChain, captureThisArg: boolean, isDelete: boolean): ts.Expression {
        const { expression, chain } = flattenChain(node);
        const left = visitNonOptionalExpression(expression, ts.isCallChain(chain[0]), /*isDelete*/ false);
        const leftThisArg = ts.isSyntheticReference(left) ? left.thisArg : undefined;
        let leftExpression = ts.isSyntheticReference(left) ? left.expression : left;
        let capturedLeft: ts.Expression = leftExpression;
        if (shouldCaptureInTempVariable(leftExpression)) {
            capturedLeft = ts.createTempVariable(hoistVariableDeclaration);
            leftExpression = ts.createAssignment(capturedLeft, leftExpression);
        }
        let rightExpression = capturedLeft;
        let thisArg: ts.Expression | undefined;
        for (let i = 0; i < chain.length; i++) {
            const segment = chain[i];
            switch (segment.kind) {
                case ts.SyntaxKind.PropertyAccessExpression:
                case ts.SyntaxKind.ElementAccessExpression:
                    if (i === chain.length - 1 && captureThisArg) {
                        if (shouldCaptureInTempVariable(rightExpression)) {
                            thisArg = ts.createTempVariable(hoistVariableDeclaration);
                            rightExpression = ts.createAssignment(thisArg, rightExpression);
                        }
                        else {
                            thisArg = rightExpression;
                        }
                    }
                    rightExpression = segment.kind === ts.SyntaxKind.PropertyAccessExpression
                        ? ts.createPropertyAccess(rightExpression, ts.visitNode(segment.name, visitor, ts.isIdentifier))
                        : ts.createElementAccess(rightExpression, ts.visitNode(segment.argumentExpression, visitor, ts.isExpression));
                    break;
                case ts.SyntaxKind.CallExpression:
                    if (i === 0 && leftThisArg) {
                        rightExpression = ts.createFunctionCall(rightExpression, leftThisArg.kind === ts.SyntaxKind.SuperKeyword ? ts.createThis() : leftThisArg, ts.visitNodes(segment.arguments, visitor, ts.isExpression));
                    }
                    else {
                        rightExpression = ts.createCall(rightExpression, 
                        /*typeArguments*/ undefined, ts.visitNodes(segment.arguments, visitor, ts.isExpression));
                    }
                    break;
            }
            ts.setOriginalNode(rightExpression, segment);
        }
        const target = isDelete
            ? ts.createConditional(createNotNullCondition(leftExpression, capturedLeft, /*invert*/ true), ts.createTrue(), ts.createDelete(rightExpression))
            : ts.createConditional(createNotNullCondition(leftExpression, capturedLeft, /*invert*/ true), ts.createVoidZero(), rightExpression);
        return thisArg ? ts.createSyntheticReferenceExpression(target, thisArg) : target;
    }
    function createNotNullCondition(left: ts.Expression, right: ts.Expression, invert?: boolean) {
        return ts.createBinary(ts.createBinary(left, ts.createToken(invert ? ts.SyntaxKind.EqualsEqualsEqualsToken : ts.SyntaxKind.ExclamationEqualsEqualsToken), ts.createNull()), ts.createToken(invert ? ts.SyntaxKind.BarBarToken : ts.SyntaxKind.AmpersandAmpersandToken), ts.createBinary(right, ts.createToken(invert ? ts.SyntaxKind.EqualsEqualsEqualsToken : ts.SyntaxKind.ExclamationEqualsEqualsToken), ts.createVoidZero()));
    }
    function transformNullishCoalescingExpression(node: ts.BinaryExpression) {
        let left = ts.visitNode(node.left, visitor, ts.isExpression);
        let right = left;
        if (shouldCaptureInTempVariable(left)) {
            right = ts.createTempVariable(hoistVariableDeclaration);
            left = ts.createAssignment(right, left);
        }
        return ts.createConditional(createNotNullCondition(left, right), right, ts.visitNode(node.right, visitor, ts.isExpression));
    }
    function shouldCaptureInTempVariable(expression: ts.Expression): boolean {
        // don't capture identifiers and `this` in a temporary variable
        // `super` cannot be captured as it's no real variable
        return !ts.isIdentifier(expression) &&
            expression.kind !== ts.SyntaxKind.ThisKeyword &&
            expression.kind !== ts.SyntaxKind.SuperKeyword;
    }
    function visitDeleteExpression(node: ts.DeleteExpression) {
        return ts.isOptionalChain(ts.skipParentheses(node.expression))
            ? ts.setOriginalNode(visitNonOptionalExpression(node.expression, /*captureThisArg*/ false, /*isDelete*/ true), node)
            : ts.updateDelete(node, ts.visitNode(node.expression, visitor, ts.isExpression));
    }
}
