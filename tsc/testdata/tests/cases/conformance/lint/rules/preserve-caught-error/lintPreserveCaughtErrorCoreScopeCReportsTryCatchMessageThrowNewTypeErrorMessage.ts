// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCReports/preserve-caught-error/try_{}_catch_({_message_})_{_throw_new_TypeError(message);_} (invocation 2).
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
try {} catch ({ message }) { throw new TypeError(message); }