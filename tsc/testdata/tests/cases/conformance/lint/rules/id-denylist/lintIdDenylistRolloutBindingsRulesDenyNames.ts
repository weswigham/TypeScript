// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutBindingsRules/deny_names (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "id-denylist": [
                "error",
                "bad"
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
let bad; bad = 1; bad(bad); new bad(bad);