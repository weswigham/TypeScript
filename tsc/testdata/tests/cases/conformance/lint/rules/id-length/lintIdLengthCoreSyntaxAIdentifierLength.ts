// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxA/identifier_length (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "id-length": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
let a = 1; function valid(b) { return b; }