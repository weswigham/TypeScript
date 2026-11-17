// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestNoDupeArgsDefault (invocation 3).
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
function f({ key: first }, [first]) {}