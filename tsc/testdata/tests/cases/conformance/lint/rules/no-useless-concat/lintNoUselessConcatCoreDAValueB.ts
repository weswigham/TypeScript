// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUselessConcat/no-useless-concat/`a${value}`_+_'b'; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-useless-concat": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
`a${value}` + 'b';