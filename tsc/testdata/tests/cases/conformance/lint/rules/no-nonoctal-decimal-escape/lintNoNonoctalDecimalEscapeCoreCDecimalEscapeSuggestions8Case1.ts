// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCDecimalEscapeSuggestions/'\8' (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-nonoctal-decimal-escape": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
'\8'