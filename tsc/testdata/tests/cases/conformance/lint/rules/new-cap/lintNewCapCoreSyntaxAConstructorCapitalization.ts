// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxA/constructor_capitalization (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "new-cap": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
new lower(); Upper(); new Upper(); lower(); Array();