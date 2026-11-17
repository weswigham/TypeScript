// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeABindingWrites/no-ex-assign/try_{}_catch_(error)_{_error.message_=_'';_function_nested(error)_{_error_=_0;_}_} (invocation 1).
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
try {} catch (error) { error.message = ''; function nested(error) { error = 0; } }