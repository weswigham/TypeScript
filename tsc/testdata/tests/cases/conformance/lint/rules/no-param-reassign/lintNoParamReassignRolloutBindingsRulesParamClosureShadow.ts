// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutBindingsRules/param_closure_shadow (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-param-reassign": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function task(value) { function closure() { value = 1; } function shadow(value) { value = 1; } { let value; value = 1; } }