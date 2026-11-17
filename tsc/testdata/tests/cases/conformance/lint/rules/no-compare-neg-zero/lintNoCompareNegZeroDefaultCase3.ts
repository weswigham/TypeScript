// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestNoCompareNegZeroDefault (invocation 3).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-compare-neg-zero": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
value == -0