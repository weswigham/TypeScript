// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxA/braces (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "curly": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
if (value) work(); else other(); while (value) work();