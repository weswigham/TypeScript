// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoContinue/continue (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-continue": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
while (true) { continue; }