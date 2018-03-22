/* @internal */
namespace ts.codefix {
    const fixId = "exportRequiredName";
    const errorCodes: number[] = [];
    for (let i = Diagnostics.Import_declaration_0_is_using_private_name_1.code;
        i <= Diagnostics.Method_0_of_exported_interface_has_or_is_using_private_name_1.code;
        i++) {
        if (i === Diagnostics.Conflicting_definitions_for_0_found_at_1_and_2_Consider_installing_a_specific_version_of_this_library_to_resolve_the_conflict.code) continue;
        if (i === Diagnostics.Property_0_of_exported_class_expression_may_not_be_private_or_protected.code) continue;
        // Only ~80 of these codes are in use, but this almost entire range is private name errors
        errorCodes.push(i);
    }
    registerCodeFix({
        errorCodes,
        getCodeActions: (context) => {
            const changes = textChanges.ChangeTracker.with(context, t => makeChange(t, context.sourceFile, context.span.start));
            return length(changes) ? [{ description: getLocaleSpecificMessage(Diagnostics.Export_private_name), changes, fixId }] : [];
        },
        fixIds: [fixId],
        getAllCodeActions: context => codeFixAll(context, errorCodes, (changes, diag) => makeChange(changes, diag.file!, diag.start!)),
    });

    function makeChange(changeTracker: textChanges.ChangeTracker, sourceFile: SourceFile, pos: number) {
        const token = getTokenAtPosition(sourceFile, pos, /*includeJsDocComment*/ false);
        
        // changeTracker.replaceNode(sourceFile, decorator.expression, replacement);
    }
}
