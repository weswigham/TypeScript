// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutExpressionsNaN/value_<_NaN; (invocation 1).
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
value < NaN;