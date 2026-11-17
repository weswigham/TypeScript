// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutBindingsRules/param_defaults (invocation 1).
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
function task(value = 1) { value = 2; value++; value.prop = 3; }