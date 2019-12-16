/* @internal */
namespace ts.codefix {
    const fixId = "constructorForDerivedNeedSuperCall";
    const errorCodes = [ts.Diagnostics.Constructors_for_derived_classes_must_contain_a_super_call.code];
    ts.codefix.registerCodeFix({
        errorCodes,
        getCodeActions(context) {
            const { sourceFile, span } = context;
            const ctr = getNode(sourceFile, span.start);
            const changes = ts.textChanges.ChangeTracker.with(context, t => doChange(t, sourceFile, ctr));
            return [ts.codefix.createCodeFixAction(fixId, changes, ts.Diagnostics.Add_missing_super_call, fixId, ts.Diagnostics.Add_all_missing_super_calls)];
        },
        fixIds: [fixId],
        getAllCodeActions: context => ts.codefix.codeFixAll(context, errorCodes, (changes, diag) => doChange(changes, context.sourceFile, getNode(diag.file, diag.start))),
    });
    function getNode(sourceFile: ts.SourceFile, pos: number): ts.ConstructorDeclaration {
        const token = ts.getTokenAtPosition(sourceFile, pos);
        ts.Debug.assert(token.kind === ts.SyntaxKind.ConstructorKeyword, "token should be at the constructor keyword");
        return token.parent as ts.ConstructorDeclaration;
    }
    function doChange(changes: ts.textChanges.ChangeTracker, sourceFile: ts.SourceFile, ctr: ts.ConstructorDeclaration) {
        const superCall = ts.createStatement(ts.createCall(ts.createSuper(), /*typeArguments*/ undefined, ts.emptyArray));
        changes.insertNodeAtConstructorStart(sourceFile, ctr, superCall);
    }
}
