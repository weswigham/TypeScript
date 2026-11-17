// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCNoSequences/1,_2,_3; (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-sequences": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
1, 2, 3;