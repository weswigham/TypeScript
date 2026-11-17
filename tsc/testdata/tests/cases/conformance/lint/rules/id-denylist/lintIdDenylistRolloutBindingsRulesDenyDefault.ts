// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutBindingsRules/deny_default (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "id-denylist": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
let bad; bad = 1;