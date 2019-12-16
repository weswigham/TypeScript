import * as ts from "./ts";
/* @internal */
const errorCodeToFixes = ts.createMultiMap<ts.CodeFixRegistration>();
/* @internal */
const fixIdToRegistration = ts.createMap<ts.CodeFixRegistration>();
/* @internal */
export type DiagnosticAndArguments = ts.DiagnosticMessage | [ts.DiagnosticMessage, string] | [ts.DiagnosticMessage, string, string];
/* @internal */
function diagnosticToString(diag: DiagnosticAndArguments): string {
    return ts.isArray(diag)
        ? ts.formatStringFromArgs(ts.getLocaleSpecificMessage(diag[0]), (diag.slice(1) as readonly string[]))
        : ts.getLocaleSpecificMessage(diag);
}
/* @internal */
export function createCodeFixActionNoFixId(fixName: string, changes: ts.FileTextChanges[], description: DiagnosticAndArguments) {
    return createCodeFixActionWorker(fixName, diagnosticToString(description), changes, /*fixId*/ undefined, /*fixAllDescription*/ undefined);
}
/* @internal */
export function createCodeFixAction(fixName: string, changes: ts.FileTextChanges[], description: DiagnosticAndArguments, fixId: {}, fixAllDescription: DiagnosticAndArguments, command?: ts.CodeActionCommand): ts.CodeFixAction {
    return createCodeFixActionWorker(fixName, diagnosticToString(description), changes, fixId, diagnosticToString(fixAllDescription), command);
}
/* @internal */
function createCodeFixActionWorker(fixName: string, description: string, changes: ts.FileTextChanges[], fixId?: {}, fixAllDescription?: string, command?: ts.CodeActionCommand): ts.CodeFixAction {
    return { fixName, description, changes, fixId, fixAllDescription, commands: command ? [command] : undefined };
}
/* @internal */
export function registerCodeFix(reg: ts.CodeFixRegistration) {
    for (const error of reg.errorCodes) {
        errorCodeToFixes.add(String(error), reg);
    }
    if (reg.fixIds) {
        for (const fixId of reg.fixIds) {
            ts.Debug.assert(!fixIdToRegistration.has(fixId));
            fixIdToRegistration.set(fixId, reg);
        }
    }
}
/* @internal */
export function getSupportedErrorCodes(): string[] {
    return ts.arrayFrom(errorCodeToFixes.keys());
}
/* @internal */
export function getFixes(context: ts.CodeFixContext): readonly ts.CodeFixAction[] {
    return ts.flatMap(errorCodeToFixes.get(String(context.errorCode)) || ts.emptyArray, f => f.getCodeActions(context));
}
/* @internal */
export function getAllFixes(context: ts.CodeFixAllContext): ts.CombinedCodeActions {
    // Currently fixId is always a string.
    return fixIdToRegistration.get(ts.cast(context.fixId, ts.isString))!.getAllCodeActions!(context);
}
/* @internal */
export function createCombinedCodeActions(changes: ts.FileTextChanges[], commands?: ts.CodeActionCommand[]): ts.CombinedCodeActions {
    return { changes, commands };
}
/* @internal */
export function createFileTextChanges(fileName: string, textChanges: ts.TextChange[]): ts.FileTextChanges {
    return { fileName, textChanges };
}
/* @internal */
export function codeFixAll(context: ts.CodeFixAllContext, errorCodes: number[], use: (changes: ts.textChanges.ChangeTracker, error: ts.DiagnosticWithLocation, commands: ts.Push<ts.CodeActionCommand>) => void): ts.CombinedCodeActions {
    const commands: ts.CodeActionCommand[] = [];
    const changes = ts.textChanges.ChangeTracker.with(context, t => eachDiagnostic(context, errorCodes, diag => use(t, diag, commands)));
    return createCombinedCodeActions(changes, commands.length === 0 ? undefined : commands);
}
/* @internal */
export function eachDiagnostic({ program, sourceFile, cancellationToken }: ts.CodeFixAllContext, errorCodes: readonly number[], cb: (diag: ts.DiagnosticWithLocation) => void): void {
    for (const diag of program.getSemanticDiagnostics(sourceFile, cancellationToken).concat(ts.computeSuggestionDiagnostics(sourceFile, program, cancellationToken))) {
        if (ts.contains(errorCodes, diag.code)) {
            cb((diag as ts.DiagnosticWithLocation));
        }
    }
}
