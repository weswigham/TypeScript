// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoLossOfPrecision/precision (invocation 1).
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
const values = [9007199254740993, 9007199254740991, 0x20000000000001, 0x20000000000000, 1e999, 1e-999, 0e999, 5e-324, 1230000000000000000000000, 1230000000000000000000000.0];