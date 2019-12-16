import * as ts from "../ts";
/* @internal */
const fixName = "invalidImportSyntax";
/* @internal */
function getCodeFixesForImportDeclaration(context: ts.CodeFixContext, node: ts.ImportDeclaration): ts.CodeFixAction[] {
    const sourceFile = ts.getSourceFileOfNode(node);
    const namespace = (ts.getNamespaceDeclarationNode(node) as ts.NamespaceImport);
    const opts = context.program.getCompilerOptions();
    const variations: ts.CodeFixAction[] = [];
    // import Bluebird from "bluebird";
    variations.push(createAction(context, sourceFile, node, ts.makeImport(namespace.name, /*namedImports*/ undefined, node.moduleSpecifier, ts.getQuotePreference(sourceFile, context.preferences))));
    if (ts.getEmitModuleKind(opts) === ts.ModuleKind.CommonJS) {
        // import Bluebird = require("bluebird");
        variations.push(createAction(context, sourceFile, node, ts.createImportEqualsDeclaration(
        /*decorators*/ undefined, 
        /*modifiers*/ undefined, namespace.name, ts.createExternalModuleReference(node.moduleSpecifier))));
    }
    return variations;
}
/* @internal */
function createAction(context: ts.CodeFixContext, sourceFile: ts.SourceFile, node: ts.Node, replacement: ts.Node): ts.CodeFixAction {
    const changes = ts.textChanges.ChangeTracker.with(context, t => t.replaceNode(sourceFile, node, replacement));
    return ts.codefix.createCodeFixActionNoFixId(fixName, changes, [ts.Diagnostics.Replace_import_with_0, changes[0].textChanges[0].newText]);
}
/* @internal */
ts.codefix.registerCodeFix({
    errorCodes: [
        ts.Diagnostics.This_expression_is_not_callable.code,
        ts.Diagnostics.This_expression_is_not_constructable.code,
    ],
    getCodeActions: getActionsForUsageOfInvalidImport
});
/* @internal */
function getActionsForUsageOfInvalidImport(context: ts.CodeFixContext): ts.CodeFixAction[] | undefined {
    const sourceFile = context.sourceFile;
    const targetKind = ts.Diagnostics.This_expression_is_not_callable.code === context.errorCode ? ts.SyntaxKind.CallExpression : ts.SyntaxKind.NewExpression;
    const node = (ts.findAncestor(ts.getTokenAtPosition(sourceFile, context.span.start), a => a.kind === targetKind) as ts.CallExpression | ts.NewExpression);
    if (!node) {
        return [];
    }
    const expr = node.expression;
    return getImportCodeFixesForExpression(context, expr);
}
/* @internal */
ts.codefix.registerCodeFix({
    errorCodes: [
        // The following error codes cover pretty much all assignability errors that could involve an expression
        ts.Diagnostics.Argument_of_type_0_is_not_assignable_to_parameter_of_type_1.code,
        ts.Diagnostics.Type_0_does_not_satisfy_the_constraint_1.code,
        ts.Diagnostics.Type_0_is_not_assignable_to_type_1.code,
        ts.Diagnostics.Type_0_is_not_assignable_to_type_1_Two_different_types_with_this_name_exist_but_they_are_unrelated.code,
        ts.Diagnostics.Type_predicate_0_is_not_assignable_to_1.code,
        ts.Diagnostics.Property_0_of_type_1_is_not_assignable_to_string_index_type_2.code,
        ts.Diagnostics.Property_0_of_type_1_is_not_assignable_to_numeric_index_type_2.code,
        ts.Diagnostics.Numeric_index_type_0_is_not_assignable_to_string_index_type_1.code,
        ts.Diagnostics.Property_0_in_type_1_is_not_assignable_to_the_same_property_in_base_type_2.code,
        ts.Diagnostics.Property_0_in_type_1_is_not_assignable_to_type_2.code,
        ts.Diagnostics.Property_0_of_JSX_spread_attribute_is_not_assignable_to_target_property.code,
        ts.Diagnostics.The_this_context_of_type_0_is_not_assignable_to_method_s_this_of_type_1.code,
    ],
    getCodeActions: getActionsForInvalidImportLocation
});
/* @internal */
function getActionsForInvalidImportLocation(context: ts.CodeFixContext): ts.CodeFixAction[] | undefined {
    const sourceFile = context.sourceFile;
    const node = ts.findAncestor(ts.getTokenAtPosition(sourceFile, context.span.start), a => a.getStart() === context.span.start && a.getEnd() === (context.span.start + context.span.length));
    if (!node) {
        return [];
    }
    return getImportCodeFixesForExpression(context, node);
}
/* @internal */
function getImportCodeFixesForExpression(context: ts.CodeFixContext, expr: ts.Node): ts.CodeFixAction[] | undefined {
    const type = context.program.getTypeChecker().getTypeAtLocation(expr);
    if (!(type.symbol && (type.symbol as ts.TransientSymbol).originatingImport)) {
        return [];
    }
    const fixes: ts.CodeFixAction[] = [];
    const relatedImport = ((type.symbol as ts.TransientSymbol).originatingImport!); // TODO: GH#18217
    if (!ts.isImportCall(relatedImport)) {
        ts.addRange(fixes, getCodeFixesForImportDeclaration(context, relatedImport));
    }
    if (ts.isExpression(expr) && !(ts.isNamedDeclaration(expr.parent) && expr.parent.name === expr)) {
        const sourceFile = context.sourceFile;
        const changes = ts.textChanges.ChangeTracker.with(context, t => t.replaceNode(sourceFile, expr, ts.createPropertyAccess(expr, "default"), {}));
        fixes.push(ts.codefix.createCodeFixActionNoFixId(fixName, changes, ts.Diagnostics.Use_synthetic_default_member));
    }
    return fixes;
}
