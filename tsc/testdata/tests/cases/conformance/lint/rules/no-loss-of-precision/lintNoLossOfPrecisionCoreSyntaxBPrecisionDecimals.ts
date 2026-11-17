// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoLossOfPrecision/precision_decimals (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-loss-of-precision": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const values = [123.456, 9.00e2, 0.000123, .1230000000000000000000000, 1.0000000000000000000000123];