// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreAuditGapsSuggestions/no-promise-executor-return/new_Promise(resolve_=>_resolve()); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-promise-executor-return": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
new Promise(resolve => resolve());