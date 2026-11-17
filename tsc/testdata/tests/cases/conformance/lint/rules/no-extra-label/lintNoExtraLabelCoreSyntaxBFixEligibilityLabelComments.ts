// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoExtraLabelFixEligibility/label_comments (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-extra-label": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
outer: while (true) { break /*keep*/ outer; }