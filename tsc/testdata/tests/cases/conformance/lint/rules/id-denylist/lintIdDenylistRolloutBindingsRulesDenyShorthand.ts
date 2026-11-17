// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutBindingsRules/deny_shorthand (invocation 1).
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
const {bad} = source; const value = {bad}; ({bad} = source);