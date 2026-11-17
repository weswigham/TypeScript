// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCNoSelfAssignRanges (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-self-assign": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
a.b = a.b