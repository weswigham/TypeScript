// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestNoDupeArgsDefault (invocation 13).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-dupe-args": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const arrow = (first, first) => {};