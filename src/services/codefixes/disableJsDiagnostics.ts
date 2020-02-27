import { mapDefined, Diagnostics, DiagnosticCategory, isInJSFile, isCheckJsEnabledForFile, CodeFixAction, createTextChange, createTextSpanFromBounds, createTextSpan, getNewLineOrDefaultFromHost, createMap, SourceFile, getLineAndCharacterOfPosition, addToSeen } from "../ts";
import { registerCodeFix, createCodeFixActionWithoutFixAll, createFileTextChanges, createCodeFixAction, codeFixAll } from "../ts.codefix";
import { isValidLocationToAddComment, ChangeTracker } from "../ts.textChanges";
import * as ts from "../ts";
/* @internal */
const fixName = "disableJsDiagnostics";
/* @internal */
const fixId = "disableJsDiagnostics";
/* @internal */
const errorCodes = mapDefined((Object.keys(Diagnostics) as readonly (keyof typeof Diagnostics)[]), key => {
    const diag = Diagnostics[key];
    return diag.category === DiagnosticCategory.Error ? diag.code : undefined;
});
/* @internal */
registerCodeFix({
    errorCodes,
    getCodeActions(context) {
        const { sourceFile, program, span, host, formatContext } = context;
        if (!isInJSFile(sourceFile) || !isCheckJsEnabledForFile(sourceFile, program.getCompilerOptions())) {
            return undefined;
        }
        const fixes: CodeFixAction[] = [
            // fixId unnecessary because adding `// @ts-nocheck` even once will ignore every error in the file.
            createCodeFixActionWithoutFixAll(fixName, [createFileTextChanges(sourceFile.fileName, [
                    createTextChange(sourceFile.checkJsDirective
                        ? createTextSpanFromBounds(sourceFile.checkJsDirective.pos, sourceFile.checkJsDirective.end)
                        : createTextSpan(0, 0), `// @ts-nocheck${getNewLineOrDefaultFromHost(host, formatContext.options)}`),
                ])], Diagnostics.Disable_checking_for_this_file),
        ];
        if (isValidLocationToAddComment(sourceFile, span.start)) {
            fixes.unshift(createCodeFixAction(fixName, ChangeTracker.with(context, t => makeChange(t, sourceFile, span.start)), Diagnostics.Ignore_this_error_message, fixId, Diagnostics.Add_ts_ignore_to_all_error_messages));
        }
        return fixes;
    },
    fixIds: [fixId],
    getAllCodeActions: context => {
        const seenLines = createMap<true>();
        return codeFixAll(context, errorCodes, (changes, diag) => {
            if (isValidLocationToAddComment(diag.file, diag.start)) {
                makeChange(changes, diag.file, diag.start, seenLines);
            }
        });
    },
});
/* @internal */
function makeChange(changes: ChangeTracker, sourceFile: SourceFile, position: number, seenLines?: ts.Map<true>) {
    const { line: lineNumber } = getLineAndCharacterOfPosition(sourceFile, position);
    // Only need to add `// @ts-ignore` for a line once.
    if (!seenLines || addToSeen(seenLines, lineNumber)) {
        changes.insertCommentBeforeLine(sourceFile, lineNumber, position, " @ts-ignore");
    }
}
