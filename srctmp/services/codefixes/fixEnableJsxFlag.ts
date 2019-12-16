import * as ts from "../ts";
/* @internal */
const fixID = "fixEnableJsxFlag";
/* @internal */
const errorCodes = [ts.Diagnostics.Cannot_use_JSX_unless_the_jsx_flag_is_provided.code];
/* @internal */
ts.codefix.registerCodeFix({
    errorCodes,
    getCodeActions: context => {
        const { configFile } = context.program.getCompilerOptions();
        if (configFile === undefined) {
            return undefined;
        }
        const changes = ts.textChanges.ChangeTracker.with(context, changeTracker => doChange(changeTracker, configFile));
        return [
            ts.codefix.createCodeFixActionNoFixId(fixID, changes, ts.Diagnostics.Enable_the_jsx_flag_in_your_configuration_file)
        ];
    },
    fixIds: [fixID],
    getAllCodeActions: context => ts.codefix.codeFixAll(context, errorCodes, changes => {
        const { configFile } = context.program.getCompilerOptions();
        if (configFile === undefined) {
            return undefined;
        }
        doChange(changes, configFile);
    })
});
/* @internal */
function doChange(changeTracker: ts.textChanges.ChangeTracker, configFile: ts.TsConfigSourceFile) {
    ts.codefix.setJsonCompilerOptionValue(changeTracker, configFile, "jsx", ts.createStringLiteral("react"));
}
