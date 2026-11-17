// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeABindingWrites/no-ex-assign/try_{}_catch_(error)_{_function_nested()_{_error_=_0;_}_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-ex-assign": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
try {} catch (error) { function nested() { error = 0; } }