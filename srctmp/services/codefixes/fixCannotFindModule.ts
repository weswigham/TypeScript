import * as ts from "../ts";
/* @internal */
const fixName = "fixCannotFindModule";
/* @internal */
const fixIdInstallTypesPackage = "installTypesPackage";
/* @internal */
const errorCodeCannotFindModule = ts.Diagnostics.Cannot_find_module_0.code;
/* @internal */
const errorCodes = [
    errorCodeCannotFindModule,
    ts.Diagnostics.Could_not_find_a_declaration_file_for_module_0_1_implicitly_has_an_any_type.code,
];
/* @internal */
ts.codefix.registerCodeFix({
    errorCodes,
    getCodeActions: context => {
        const { host, sourceFile, span: { start } } = context;
        const packageName = tryGetImportedPackageName(sourceFile, start);
        if (packageName === undefined)
            return undefined;
        const typesPackageName = getTypesPackageNameToInstall(packageName, host, context.errorCode);
        return typesPackageName === undefined
            ? []
            : [ts.codefix.createCodeFixAction(fixName, /*changes*/ [], [ts.Diagnostics.Install_0, typesPackageName], fixIdInstallTypesPackage, ts.Diagnostics.Install_all_missing_types_packages, getInstallCommand(sourceFile.fileName, typesPackageName))];
    },
    fixIds: [fixIdInstallTypesPackage],
    getAllCodeActions: context => {
        return ts.codefix.codeFixAll(context, errorCodes, (_changes, diag, commands) => {
            const packageName = tryGetImportedPackageName(diag.file, diag.start);
            if (packageName === undefined)
                return undefined;
            switch (context.fixId) {
                case fixIdInstallTypesPackage: {
                    const pkg = getTypesPackageNameToInstall(packageName, context.host, diag.code);
                    if (pkg) {
                        commands.push(getInstallCommand(diag.file.fileName, pkg));
                    }
                    break;
                }
                default:
                    ts.Debug.fail(`Bad fixId: ${context.fixId}`);
            }
        });
    },
});
/* @internal */
function getInstallCommand(fileName: string, packageName: string): ts.InstallPackageAction {
    return { type: "install package", file: fileName, packageName };
}
/* @internal */
function tryGetImportedPackageName(sourceFile: ts.SourceFile, pos: number): string | undefined {
    const moduleName = ts.cast(ts.getTokenAtPosition(sourceFile, pos), ts.isStringLiteral).text;
    const { packageName } = ts.parsePackageName(moduleName);
    return ts.isExternalModuleNameRelative(packageName) ? undefined : packageName;
}
/* @internal */
function getTypesPackageNameToInstall(packageName: string, host: ts.LanguageServiceHost, diagCode: number): string | undefined {
    return diagCode === errorCodeCannotFindModule
        ? (ts.JsTyping.nodeCoreModules.has(packageName) ? "@types/node" : undefined)
        : (host.isKnownTypesPackageName!(packageName) ? ts.getTypesPackageName(packageName) : undefined); // TODO: GH#18217
}
