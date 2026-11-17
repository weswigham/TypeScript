// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxAOptions/capitalized-comments///_Uppercase (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "capitalized-comments": [
                "error",
                "never"
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
// Uppercase