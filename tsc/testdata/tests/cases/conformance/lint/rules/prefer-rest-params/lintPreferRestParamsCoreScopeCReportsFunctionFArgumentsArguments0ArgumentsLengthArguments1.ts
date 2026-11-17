// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCReports/prefer-rest-params/function_f()_{_arguments;_arguments[0];_arguments.length;_(()_=>_arguments[1])();_} (invocation 2).
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
function f() { arguments; arguments[0]; arguments.length; (() => arguments[1])(); }