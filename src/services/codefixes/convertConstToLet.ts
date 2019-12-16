/* @internal */
namespace ts.codefix {
    const fixId = "fixConvertConstToLet";
    const errorCodes = [ts.Diagnostics.Cannot_assign_to_0_because_it_is_a_constant.code];
    ts.codefix.registerCodeFix({
        errorCodes,
        getCodeActions: context => {
            const { sourceFile, span, program } = context;
            const variableStatement = getVariableStatement(sourceFile, span.start, program);
            const changes = ts.textChanges.ChangeTracker.with(context, t => doChange(t, sourceFile, variableStatement));
            return [ts.codefix.createCodeFixAction(fixId, changes, ts.Diagnostics.Convert_const_to_let, fixId, ts.Diagnostics.Convert_const_to_let)];
        },
        fixIds: [fixId]
    });
    function getVariableStatement(sourceFile: ts.SourceFile, pos: number, program: ts.Program) {
        const token = ts.getTokenAtPosition(sourceFile, pos);
        const checker = program.getTypeChecker();
        const symbol = checker.getSymbolAtLocation(token);
        if (symbol) {
            return symbol.valueDeclaration.parent.parent as ts.VariableStatement;
        }
    }
    function doChange(changes: ts.textChanges.ChangeTracker, sourceFile: ts.SourceFile, variableStatement?: ts.VariableStatement) {
        if (!variableStatement) {
            return;
        }
        const start = variableStatement.getStart();
        changes.replaceRangeWithText(sourceFile, { pos: start, end: start + 5 }, "let");
    }
}
