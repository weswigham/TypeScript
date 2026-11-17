// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutExpressionsTemplate/work()_'hello_'_+_name; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "prefer-template": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
work()
'hello ' + name;