// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutBindingsRules/object_shadow (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-obj-calls": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function task(Math) { Math(); } { let JSON; new JSON(); } const other = {Math}; other.Math();