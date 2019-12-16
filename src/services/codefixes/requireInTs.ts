/* @internal */
namespace ts.codefix {
    const fixId = "requireInTs";
    const errorCodes = [ts.Diagnostics.require_call_may_be_converted_to_an_import.code];
    ts.codefix.registerCodeFix({
        errorCodes,
        getCodeActions(context) {
            const changes = ts.textChanges.ChangeTracker.with(context, t => doChange(t, context.sourceFile, context.span.start, context.program));
            return [ts.codefix.createCodeFixAction(fixId, changes, ts.Diagnostics.Convert_require_to_import, fixId, ts.Diagnostics.Convert_all_require_to_import)];
        },
        fixIds: [fixId],
        getAllCodeActions: context => ts.codefix.codeFixAll(context, errorCodes, (changes, diag) => doChange(changes, diag.file, diag.start, context.program)),
    });
    function doChange(changes: ts.textChanges.ChangeTracker, sourceFile: ts.SourceFile, pos: number, program: ts.Program) {
        const { statement, name, required } = getInfo(sourceFile, pos);
        changes.replaceNode(sourceFile, statement, ts.getAllowSyntheticDefaultImports(program.getCompilerOptions())
            ? ts.createImportDeclaration(/*decorators*/ undefined, /*modifiers*/ undefined, ts.createImportClause(name, /*namedBindings*/ undefined), required)
            : ts.createImportEqualsDeclaration(/*decorators*/ undefined, /*modifiers*/ undefined, name, ts.createExternalModuleReference(required)));
    }
    interface Info {
        readonly statement: ts.VariableStatement;
        readonly name: ts.Identifier;
        readonly required: ts.StringLiteralLike;
    }
    function getInfo(sourceFile: ts.SourceFile, pos: number): Info {
        const { parent } = ts.getTokenAtPosition(sourceFile, pos);
        if (!ts.isRequireCall(parent, /*checkArgumentIsStringLiteralLike*/ true))
            throw ts.Debug.failBadSyntaxKind(parent);
        const decl = ts.cast(parent.parent, ts.isVariableDeclaration);
        return { statement: ts.cast(decl.parent.parent, ts.isVariableStatement), name: ts.cast(decl.name, ts.isIdentifier), required: parent.arguments[0] };
    }
}
