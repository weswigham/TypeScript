// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoEqNull/null_comparison (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-eq-null": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
value == null; null != value; value === null; value == undefined;