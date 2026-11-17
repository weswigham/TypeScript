// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutExpressionsNaN/function_run(Number)_{_return_value_===_Number.NaN;_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "use-isnan": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function run(Number) { return value === Number.NaN; }