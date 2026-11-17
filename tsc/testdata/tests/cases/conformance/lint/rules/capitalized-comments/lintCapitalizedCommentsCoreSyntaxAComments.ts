// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxA/comments (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "capitalized-comments": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
// lowercase
const value = 1;
// Uppercase
