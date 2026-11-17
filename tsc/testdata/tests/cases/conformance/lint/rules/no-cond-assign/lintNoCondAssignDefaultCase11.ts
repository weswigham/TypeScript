// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestNoCondAssignDefault (invocation 11).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-cond-assign": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
((value = other)) ? 1 : 0;