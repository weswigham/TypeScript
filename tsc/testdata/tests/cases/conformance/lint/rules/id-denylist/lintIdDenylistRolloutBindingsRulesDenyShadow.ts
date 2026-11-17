// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutBindingsRules/deny_shadow (invocation 1).
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
                "Object"
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function task(Object) { Object.keys(value); }