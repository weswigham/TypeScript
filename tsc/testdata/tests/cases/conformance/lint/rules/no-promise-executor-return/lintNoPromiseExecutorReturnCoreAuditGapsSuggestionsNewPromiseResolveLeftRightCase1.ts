// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreAuditGapsSuggestions/no-promise-executor-return/new_Promise(resolve_=>_(left_+_right)); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-promise-executor-return": [
                "error",
                {
                    "allowVoid": true
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
new Promise(resolve => (left + right));