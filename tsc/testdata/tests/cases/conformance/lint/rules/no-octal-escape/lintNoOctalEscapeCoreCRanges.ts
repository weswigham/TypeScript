// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCNoOctalEscapeRanges (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-octal-escape": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
'foo\378bar'