import * as ts from "../ts";
/* @internal */
const refactorName = "Add or remove braces in an arrow function";
/* @internal */
const refactorDescription = ts.Diagnostics.Add_or_remove_braces_in_an_arrow_function.message;
/* @internal */
const addBracesActionName = "Add braces to arrow function";
/* @internal */
const removeBracesActionName = "Remove braces from arrow function";
/* @internal */
const addBracesActionDescription = ts.Diagnostics.Add_braces_to_arrow_function.message;
/* @internal */
const removeBracesActionDescription = ts.Diagnostics.Remove_braces_from_arrow_function.message;
/* @internal */
ts.refactor.registerRefactor(refactorName, { getEditsForAction, getAvailableActions });
/* @internal */
interface Info {
    func: ts.ArrowFunction;
    expression: ts.Expression | undefined;
    returnStatement?: ts.ReturnStatement;
    addBraces: boolean;
}
/* @internal */
function getAvailableActions(context: ts.RefactorContext): readonly ts.ApplicableRefactorInfo[] {
    const { file, startPosition } = context;
    const info = getConvertibleArrowFunctionAtPosition(file, startPosition);
    if (!info)
        return ts.emptyArray;
    return [{
            name: refactorName,
            description: refactorDescription,
            actions: [
                info.addBraces ?
                    {
                        name: addBracesActionName,
                        description: addBracesActionDescription
                    } : {
                    name: removeBracesActionName,
                    description: removeBracesActionDescription
                }
            ]
        }];
}
/* @internal */
function getEditsForAction(context: ts.RefactorContext, actionName: string): ts.RefactorEditInfo | undefined {
    const { file, startPosition } = context;
    const info = getConvertibleArrowFunctionAtPosition(file, startPosition);
    if (!info)
        return undefined;
    const { expression, returnStatement, func } = info;
    let body: ts.ConciseBody;
    if (actionName === addBracesActionName) {
        const returnStatement = ts.createReturn(expression);
        body = ts.createBlock([returnStatement], /* multiLine */ true);
        ts.suppressLeadingAndTrailingTrivia(body);
        ts.copyLeadingComments((expression!), returnStatement, file, ts.SyntaxKind.MultiLineCommentTrivia, /* hasTrailingNewLine */ true);
    }
    else if (actionName === removeBracesActionName && returnStatement) {
        const actualExpression = expression || ts.createVoidZero();
        body = needsParentheses(actualExpression) ? ts.createParen(actualExpression) : actualExpression;
        ts.suppressLeadingAndTrailingTrivia(body);
        ts.copyLeadingComments(returnStatement, body, file, ts.SyntaxKind.MultiLineCommentTrivia, /* hasTrailingNewLine */ false);
    }
    else {
        ts.Debug.fail("invalid action");
    }
    const edits = ts.textChanges.ChangeTracker.with(context, t => t.replaceNode(file, func.body, body));
    return { renameFilename: undefined, renameLocation: undefined, edits };
}
/* @internal */
function needsParentheses(expression: ts.Expression) {
    return ts.isBinaryExpression(expression) && expression.operatorToken.kind === ts.SyntaxKind.CommaToken || ts.isObjectLiteralExpression(expression);
}
/* @internal */
function getConvertibleArrowFunctionAtPosition(file: ts.SourceFile, startPosition: number): Info | undefined {
    const node = ts.getTokenAtPosition(file, startPosition);
    const func = ts.getContainingFunction(node);
    if (!func || !ts.isArrowFunction(func) || (!ts.rangeContainsRange(func, node) || ts.rangeContainsRange(func.body, node)))
        return undefined;
    if (ts.isExpression(func.body)) {
        return {
            func,
            addBraces: true,
            expression: func.body
        };
    }
    else if (func.body.statements.length === 1) {
        const firstStatement = ts.first(func.body.statements);
        if (ts.isReturnStatement(firstStatement)) {
            return {
                func,
                addBraces: false,
                expression: firstStatement.expression,
                returnStatement: firstStatement
            };
        }
    }
    return undefined;
}
