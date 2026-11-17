// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoExtraLabel/extra_label_targets (invocation 1).
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
outer: while (true) { continue outer; switch (value) { default: continue outer; } inner: { break inner; } }