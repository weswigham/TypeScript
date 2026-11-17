// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutExpressionsTernary/const_result_=_call()_?_true_:_true; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-unneeded-ternary": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const result = call() ? true : true;