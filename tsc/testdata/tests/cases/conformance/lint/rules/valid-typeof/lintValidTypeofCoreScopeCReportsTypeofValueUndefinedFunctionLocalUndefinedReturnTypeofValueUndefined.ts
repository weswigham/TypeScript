// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCReports/valid-typeof/typeof_value_===_undefined;_function_local(undefined)_{_return_typeof_value_===_undefined;_} (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "valid-typeof": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
typeof value === undefined; function local(undefined) { return typeof value === undefined; }