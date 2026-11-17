// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCReports/preserve-caught-error/try_{}_catch_(error)_{_function_f()_{_throw_new_Error();_}_throw_new_Error('',_options);_} (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "preserve-caught-error": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
try {} catch (error) { function f() { throw new Error(); } throw new Error('', options); }