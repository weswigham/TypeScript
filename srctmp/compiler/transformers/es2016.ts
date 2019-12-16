import * as ts from "../ts";
/*@internal*/
export function transformES2016(context: ts.TransformationContext) {
    const { hoistVariableDeclaration } = context;
    return ts.chainBundle(transformSourceFile);
    function transformSourceFile(node: ts.SourceFile) {
        if (node.isDeclarationFile) {
            return node;
        }
        return ts.visitEachChild(node, visitor, context);
    }
    function visitor(node: ts.Node): ts.VisitResult<ts.Node> {
        if ((node.transformFlags & ts.TransformFlags.ContainsES2016) === 0) {
            return node;
        }
        switch (node.kind) {
            case ts.SyntaxKind.BinaryExpression:
                return visitBinaryExpression((<ts.BinaryExpression>node));
            default:
                return ts.visitEachChild(node, visitor, context);
        }
    }
    function visitBinaryExpression(node: ts.BinaryExpression): ts.Expression {
        switch (node.operatorToken.kind) {
            case ts.SyntaxKind.AsteriskAsteriskEqualsToken:
                return visitExponentiationAssignmentExpression(node);
            case ts.SyntaxKind.AsteriskAsteriskToken:
                return visitExponentiationExpression(node);
            default:
                return ts.visitEachChild(node, visitor, context);
        }
    }
    function visitExponentiationAssignmentExpression(node: ts.BinaryExpression) {
        let target: ts.Expression;
        let value: ts.Expression;
        const left = ts.visitNode(node.left, visitor, ts.isExpression);
        const right = ts.visitNode(node.right, visitor, ts.isExpression);
        if (ts.isElementAccessExpression(left)) {
            // Transforms `a[x] **= b` into `(_a = a)[_x = x] = Math.pow(_a[_x], b)`
            const expressionTemp = ts.createTempVariable(hoistVariableDeclaration);
            const argumentExpressionTemp = ts.createTempVariable(hoistVariableDeclaration);
            target = ts.setTextRange(ts.createElementAccess(ts.setTextRange(ts.createAssignment(expressionTemp, left.expression), left.expression), ts.setTextRange(ts.createAssignment(argumentExpressionTemp, left.argumentExpression), left.argumentExpression)), left);
            value = ts.setTextRange(ts.createElementAccess(expressionTemp, argumentExpressionTemp), left);
        }
        else if (ts.isPropertyAccessExpression(left)) {
            // Transforms `a.x **= b` into `(_a = a).x = Math.pow(_a.x, b)`
            const expressionTemp = ts.createTempVariable(hoistVariableDeclaration);
            target = ts.setTextRange(ts.createPropertyAccess(ts.setTextRange(ts.createAssignment(expressionTemp, left.expression), left.expression), left.name), left);
            value = ts.setTextRange(ts.createPropertyAccess(expressionTemp, left.name), left);
        }
        else {
            // Transforms `a **= b` into `a = Math.pow(a, b)`
            target = left;
            value = left;
        }
        return ts.setTextRange(ts.createAssignment(target, ts.createMathPow(value, right, /*location*/ node)), node);
    }
    function visitExponentiationExpression(node: ts.BinaryExpression) {
        // Transforms `a ** b` into `Math.pow(a, b)`
        const left = ts.visitNode(node.left, visitor, ts.isExpression);
        const right = ts.visitNode(node.right, visitor, ts.isExpression);
        return ts.createMathPow(left, right, /*location*/ node);
    }
}
