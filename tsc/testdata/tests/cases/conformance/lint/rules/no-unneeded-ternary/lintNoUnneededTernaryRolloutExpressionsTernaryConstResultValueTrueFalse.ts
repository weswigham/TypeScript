// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutExpressionsTernary/const_result_=_value_?_true_:_false; (invocation 1).
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
const result = value ? true : false;