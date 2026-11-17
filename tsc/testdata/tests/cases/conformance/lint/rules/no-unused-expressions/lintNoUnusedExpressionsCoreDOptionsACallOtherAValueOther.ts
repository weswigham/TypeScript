// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUnusedExpressionsOptions/no-unused-expressions/a_?_call()_:_other();_a_?_value_:_other(); (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-unused-expressions": [
                "error",
                {
                    "allowTernary": true
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
a ? call() : other(); a ? value : other();