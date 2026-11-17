// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutExpressionsNaN/values.indexOf(NaN); (invocation 1).
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
values.indexOf(NaN);