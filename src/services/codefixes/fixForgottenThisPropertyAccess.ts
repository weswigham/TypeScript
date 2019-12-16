/* @internal */
namespace ts.codefix {
    const fixId = "forgottenThisPropertyAccess";
    const didYouMeanStaticMemberCode = ts.Diagnostics.Cannot_find_name_0_Did_you_mean_the_static_member_1_0.code;
    const errorCodes = [
        ts.Diagnostics.Cannot_find_name_0_Did_you_mean_the_instance_member_this_0.code,
        didYouMeanStaticMemberCode,
    ];
    ts.codefix.registerCodeFix({
        errorCodes,
        getCodeActions(context) {
            const { sourceFile } = context;
            const info = getInfo(sourceFile, context.span.start, context.errorCode);
            if (!info) {
                return undefined;
            }
            const changes = ts.textChanges.ChangeTracker.with(context, t => doChange(t, sourceFile, info));
            return [ts.codefix.createCodeFixAction(fixId, changes, [ts.Diagnostics.Add_0_to_unresolved_variable, info.className || "this"], fixId, ts.Diagnostics.Add_qualifier_to_all_unresolved_variables_matching_a_member_name)];
        },
        fixIds: [fixId],
        getAllCodeActions: context => ts.codefix.codeFixAll(context, errorCodes, (changes, diag) => {
            const info = getInfo(diag.file, diag.start, diag.code);
            if (info)
                doChange(changes, context.sourceFile, info);
        }),
    });
    interface Info {
        readonly node: ts.Identifier;
        readonly className: string | undefined;
    }
    function getInfo(sourceFile: ts.SourceFile, pos: number, diagCode: number): Info | undefined {
        const node = ts.getTokenAtPosition(sourceFile, pos);
        if (!ts.isIdentifier(node))
            return undefined;
        return { node, className: diagCode === didYouMeanStaticMemberCode ? ts.getContainingClass(node)!.name!.text : undefined };
    }
    function doChange(changes: ts.textChanges.ChangeTracker, sourceFile: ts.SourceFile, { node, className }: Info): void {
        // TODO (https://github.com/Microsoft/TypeScript/issues/21246): use shared helper
        ts.suppressLeadingAndTrailingTrivia(node);
        changes.replaceNode(sourceFile, node, ts.createPropertyAccess(className ? ts.createIdentifier(className) : ts.createThis(), node));
    }
}
