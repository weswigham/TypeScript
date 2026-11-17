// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutExpressionsPower/const_result_=_Math.pow(-base,_exponent); (invocation 1).
// Migrated from TestRolloutExpressionsPowerWrapping/const_result_=_Math.pow(-base,_exponent); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "prefer-exponentiation-operator": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const result = Math.pow(-base, exponent);