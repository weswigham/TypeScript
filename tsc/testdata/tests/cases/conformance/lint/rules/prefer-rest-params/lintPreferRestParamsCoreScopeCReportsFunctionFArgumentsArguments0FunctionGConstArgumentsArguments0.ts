// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCReports/prefer-rest-params/function_f(arguments)_{_arguments[0];_}_function_g()_{_const_arguments_=_[];_arguments[0];_} (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "prefer-rest-params": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function f(arguments) { arguments[0]; } function g() { const arguments = []; arguments[0]; }