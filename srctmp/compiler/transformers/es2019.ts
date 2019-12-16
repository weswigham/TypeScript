import * as ts from "../ts";
/*@internal*/
export function transformES2019(context: ts.TransformationContext) {
    return ts.chainBundle(transformSourceFile);
    function transformSourceFile(node: ts.SourceFile) {
        if (node.isDeclarationFile) {
            return node;
        }
        return ts.visitEachChild(node, visitor, context);
    }
    function visitor(node: ts.Node): ts.VisitResult<ts.Node> {
        if ((node.transformFlags & ts.TransformFlags.ContainsES2019) === 0) {
            return node;
        }
        switch (node.kind) {
            case ts.SyntaxKind.CatchClause:
                return visitCatchClause((node as ts.CatchClause));
            default:
                return ts.visitEachChild(node, visitor, context);
        }
    }
    function visitCatchClause(node: ts.CatchClause): ts.CatchClause {
        if (!node.variableDeclaration) {
            return ts.updateCatchClause(node, ts.createVariableDeclaration(ts.createTempVariable(/*recordTempVariable*/ undefined)), ts.visitNode(node.block, visitor, ts.isBlock));
        }
        return ts.visitEachChild(node, visitor, context);
    }
}
