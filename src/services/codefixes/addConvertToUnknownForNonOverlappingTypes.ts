/* @internal */
namespace ts.codefix {
    const fixId = "addConvertToUnknownForNonOverlappingTypes";
    const errorCodes = [ts.Diagnostics.Conversion_of_type_0_to_type_1_may_be_a_mistake_because_neither_type_sufficiently_overlaps_with_the_other_If_this_was_intentional_convert_the_expression_to_unknown_first.code];
    ts.codefix.registerCodeFix({
        errorCodes,
        getCodeActions: (context) => {
            const changes = ts.textChanges.ChangeTracker.with(context, t => makeChange(t, context.sourceFile, context.span.start));
            return [ts.codefix.createCodeFixAction(fixId, changes, ts.Diagnostics.Add_unknown_conversion_for_non_overlapping_types, fixId, ts.Diagnostics.Add_unknown_to_all_conversions_of_non_overlapping_types)];
        },
        fixIds: [fixId],
        getAllCodeActions: context => ts.codefix.codeFixAll(context, errorCodes, (changes, diag) => makeChange(changes, diag.file, diag.start)),
    });
    function makeChange(changeTracker: ts.textChanges.ChangeTracker, sourceFile: ts.SourceFile, pos: number) {
        const token = ts.getTokenAtPosition(sourceFile, pos);
        const assertion = ts.Debug.assertDefined(ts.findAncestor(token, (n): n is ts.AsExpression | ts.TypeAssertion => ts.isAsExpression(n) || ts.isTypeAssertion(n)), "Expected to find an assertion expression");
        const replacement = ts.isAsExpression(assertion)
            ? ts.createAsExpression(assertion.expression, ts.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword))
            : ts.createTypeAssertion(ts.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword), assertion.expression);
        changeTracker.replaceNode(sourceFile, assertion.expression, replacement);
    }
}
