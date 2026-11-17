// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCReports/prefer-rest-params/arguments[0];_const_f_=_()_=>_arguments[0];_function_g()_{_({_arguments_});_arguments?.length;_} (invocation 2).
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
arguments[0]; const f = () => arguments[0]; function g() { ({ arguments }); arguments?.length; }