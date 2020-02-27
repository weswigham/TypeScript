import { registerCodeFix, setJsonCompilerOptionValue, createCodeFixActionWithoutFixAll, setJsonCompilerOptionValues } from "../ts.codefix";
import { Diagnostics, CodeFixAction, getEmitModuleKind, ModuleKind, createStringLiteral, getEmitScriptTarget, ScriptTarget, getTsConfigObjectLiteralExpression, Expression } from "../ts";
import { ChangeTracker } from "../ts.textChanges";
/* @internal */
registerCodeFix({
    errorCodes: [Diagnostics.Top_level_await_expressions_are_only_allowed_when_the_module_option_is_set_to_esnext_or_system_and_the_target_option_is_set_to_es2017_or_higher.code],
    getCodeActions: context => {
        const compilerOptions = context.program.getCompilerOptions();
        const { configFile } = compilerOptions;
        if (configFile === undefined) {
            return undefined;
        }
        const codeFixes: CodeFixAction[] = [];
        const moduleKind = getEmitModuleKind(compilerOptions);
        const moduleOutOfRange = moduleKind >= ModuleKind.ES2015 && moduleKind < ModuleKind.ESNext;
        if (moduleOutOfRange) {
            const changes = ChangeTracker.with(context, changes => {
                setJsonCompilerOptionValue(changes, configFile, "module", createStringLiteral("esnext"));
            });
            codeFixes.push(createCodeFixActionWithoutFixAll("fixModuleOption", changes, [Diagnostics.Set_the_module_option_in_your_configuration_file_to_0, "esnext"]));
        }
        const target = getEmitScriptTarget(compilerOptions);
        const targetOutOfRange = target < ScriptTarget.ES2017 || target > ScriptTarget.ESNext;
        if (targetOutOfRange) {
            const changes = ChangeTracker.with(context, tracker => {
                const configObject = getTsConfigObjectLiteralExpression(configFile);
                if (!configObject)
                    return;
                const options: [string, Expression][] = [["target", createStringLiteral("es2017")]];
                if (moduleKind === ModuleKind.CommonJS) {
                    // Ensure we preserve the default module kind (commonjs), as targets >= ES2015 have a default module kind of es2015.
                    options.push(["module", createStringLiteral("commonjs")]);
                }
                setJsonCompilerOptionValues(tracker, configFile, options);
            });
            codeFixes.push(createCodeFixActionWithoutFixAll("fixTargetOption", changes, [Diagnostics.Set_the_target_option_in_your_configuration_file_to_0, "es2017"]));
        }
        return codeFixes.length ? codeFixes : undefined;
    }
});
