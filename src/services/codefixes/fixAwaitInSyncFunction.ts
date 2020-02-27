import { Diagnostics, createMap, addToSeen, getNodeId, FunctionDeclaration, MethodDeclaration, FunctionExpression, ArrowFunction, isVariableDeclaration, isFunctionTypeNode, SourceFile, Node, TypeNode, getTokenAtPosition, getContainingFunction, SyntaxKind, findChildOfKind, first, getEntityNameFromTypeNode, createTypeReferenceNode, createNodeArray } from "../ts";
import { registerCodeFix, createCodeFixAction, codeFixAll } from "../ts.codefix";
import { ChangeTracker } from "../ts.textChanges";
/* @internal */
const fixId = "fixAwaitInSyncFunction";
/* @internal */
const errorCodes = [
    Diagnostics.await_expressions_are_only_allowed_within_async_functions_and_at_the_top_levels_of_modules.code,
    Diagnostics.A_for_await_of_statement_is_only_allowed_within_an_async_function_or_async_generator.code,
];
/* @internal */
registerCodeFix({
    errorCodes,
    getCodeActions(context) {
        const { sourceFile, span } = context;
        const nodes = getNodes(sourceFile, span.start);
        if (!nodes)
            return undefined;
        const changes = ChangeTracker.with(context, t => doChange(t, sourceFile, nodes));
        return [createCodeFixAction(fixId, changes, Diagnostics.Add_async_modifier_to_containing_function, fixId, Diagnostics.Add_all_missing_async_modifiers)];
    },
    fixIds: [fixId],
    getAllCodeActions: context => {
        const seen = createMap<true>();
        return codeFixAll(context, errorCodes, (changes, diag) => {
            const nodes = getNodes(diag.file, diag.start);
            if (!nodes || !addToSeen(seen, getNodeId(nodes.insertBefore)))
                return;
            doChange(changes, context.sourceFile, nodes);
        });
    },
});
/* @internal */
function getReturnType(expr: FunctionDeclaration | MethodDeclaration | FunctionExpression | ArrowFunction) {
    if (expr.type) {
        return expr.type;
    }
    if (isVariableDeclaration(expr.parent) &&
        expr.parent.type &&
        isFunctionTypeNode(expr.parent.type)) {
        return expr.parent.type.type;
    }
}
/* @internal */
function getNodes(sourceFile: SourceFile, start: number): {
    insertBefore: Node;
    returnType: TypeNode | undefined;
} | undefined {
    const token = getTokenAtPosition(sourceFile, start);
    const containingFunction = getContainingFunction(token);
    if (!containingFunction) {
        return;
    }
    let insertBefore: Node | undefined;
    switch (containingFunction.kind) {
        case SyntaxKind.MethodDeclaration:
            insertBefore = containingFunction.name;
            break;
        case SyntaxKind.FunctionDeclaration:
        case SyntaxKind.FunctionExpression:
            insertBefore = findChildOfKind(containingFunction, SyntaxKind.FunctionKeyword, sourceFile);
            break;
        case SyntaxKind.ArrowFunction:
            insertBefore = findChildOfKind(containingFunction, SyntaxKind.OpenParenToken, sourceFile) || first(containingFunction.parameters);
            break;
        default:
            return;
    }
    return insertBefore && {
        insertBefore,
        returnType: getReturnType(containingFunction)
    };
}
/* @internal */
function doChange(changes: ChangeTracker, sourceFile: SourceFile, { insertBefore, returnType }: {
    insertBefore: Node;
    returnType: TypeNode | undefined;
}): void {
    if (returnType) {
        const entityName = getEntityNameFromTypeNode(returnType);
        if (!entityName || entityName.kind !== SyntaxKind.Identifier || entityName.text !== "Promise") {
            changes.replaceNode(sourceFile, returnType, createTypeReferenceNode("Promise", createNodeArray([returnType])));
        }
    }
    changes.insertModifierBefore(sourceFile, SyntaxKind.AsyncKeyword, insertBefore);
}
