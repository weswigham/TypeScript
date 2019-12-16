import * as ts from "../ts";
/* @internal */
const fixId = "addMissingDeclareProperty";
/* @internal */
const errorCodes = [
    ts.Diagnostics.Property_0_will_overwrite_the_base_property_in_1_If_this_is_intentional_add_an_initializer_Otherwise_add_a_declare_modifier_or_remove_the_redundant_declaration.code,
];
/* @internal */
ts.codefix.registerCodeFix({
    errorCodes,
    getCodeActions: (context) => {
        const changes = ts.textChanges.ChangeTracker.with(context, t => makeChange(t, context.sourceFile, context.span.start));
        if (changes.length > 0) {
            return [ts.codefix.createCodeFixAction(fixId, changes, ts.Diagnostics.Prefix_with_declare, fixId, ts.Diagnostics.Prefix_all_incorrect_property_declarations_with_declare)];
        }
    },
    fixIds: [fixId],
    getAllCodeActions: context => {
        const fixedNodes = new ts.NodeSet();
        return ts.codefix.codeFixAll(context, errorCodes, (changes, diag) => makeChange(changes, diag.file, diag.start, fixedNodes));
    },
});
/* @internal */
function makeChange(changeTracker: ts.textChanges.ChangeTracker, sourceFile: ts.SourceFile, pos: number, fixedNodes?: ts.NodeSet<ts.Node>) {
    const token = ts.getTokenAtPosition(sourceFile, pos);
    if (!ts.isIdentifier(token)) {
        return;
    }
    const declaration = token.parent;
    if (declaration.kind === ts.SyntaxKind.PropertyDeclaration &&
        (!fixedNodes || fixedNodes.tryAdd(declaration))) {
        changeTracker.insertModifierBefore(sourceFile, ts.SyntaxKind.DeclareKeyword, declaration);
    }
}
