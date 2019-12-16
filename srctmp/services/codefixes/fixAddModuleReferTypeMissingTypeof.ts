import * as ts from "../ts";
/* @internal */
const fixIdAddMissingTypeof = "fixAddModuleReferTypeMissingTypeof";
/* @internal */
const fixId = fixIdAddMissingTypeof;
/* @internal */
const errorCodes = [ts.Diagnostics.Module_0_does_not_refer_to_a_type_but_is_used_as_a_type_here_Did_you_mean_typeof_import_0.code];
/* @internal */
ts.codefix.registerCodeFix({
    errorCodes,
    getCodeActions: context => {
        const { sourceFile, span } = context;
        const importType = getImportTypeNode(sourceFile, span.start);
        const changes = ts.textChanges.ChangeTracker.with(context, t => doChange(t, sourceFile, importType));
        return [ts.codefix.createCodeFixAction(fixId, changes, ts.Diagnostics.Add_missing_typeof, fixId, ts.Diagnostics.Add_missing_typeof)];
    },
    fixIds: [fixId],
    getAllCodeActions: context => ts.codefix.codeFixAll(context, errorCodes, (changes, diag) => doChange(changes, context.sourceFile, getImportTypeNode(diag.file, diag.start))),
});
/* @internal */
function getImportTypeNode(sourceFile: ts.SourceFile, pos: number): ts.ImportTypeNode {
    const token = ts.getTokenAtPosition(sourceFile, pos);
    ts.Debug.assert(token.kind === ts.SyntaxKind.ImportKeyword, "This token should be an ImportKeyword");
    ts.Debug.assert(token.parent.kind === ts.SyntaxKind.ImportType, "Token parent should be an ImportType");
    return <ts.ImportTypeNode>token.parent;
}
/* @internal */
function doChange(changes: ts.textChanges.ChangeTracker, sourceFile: ts.SourceFile, importType: ts.ImportTypeNode) {
    const newTypeNode = ts.updateImportTypeNode(importType, importType.argument, importType.qualifier, importType.typeArguments, /* isTypeOf */ true);
    changes.replaceNode(sourceFile, importType, newTypeNode);
}
