// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCReports/no-undefined/undefined;_let_value_=_undefined;_function_f(undefined)_{_return_undefined;_} (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-undefined": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
undefined; let value = undefined; function f(undefined) { return undefined; }