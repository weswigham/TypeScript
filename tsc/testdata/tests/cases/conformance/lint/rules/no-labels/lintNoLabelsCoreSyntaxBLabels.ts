// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoLabels/labels (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-labels": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
outer: while (true) { continue outer; break outer; }