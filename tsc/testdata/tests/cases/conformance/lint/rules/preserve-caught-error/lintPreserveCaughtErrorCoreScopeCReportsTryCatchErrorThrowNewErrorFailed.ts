// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCReports/preserve-caught-error/try_{}_catch_(error)_{_throw_new_Error('failed');_} (invocation 2).
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
try {} catch (error) { throw new Error('failed'); }