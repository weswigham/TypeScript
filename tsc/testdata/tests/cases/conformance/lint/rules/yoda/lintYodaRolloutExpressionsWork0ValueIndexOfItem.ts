// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutExpressionsYoda/work()_0_===_[value].indexOf(item); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "yoda": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
work()
0 === [value].indexOf(item);