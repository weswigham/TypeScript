// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutExpressionsPowerComments/const_result_=_Math.pow((/*_keep_*/_base),_exponent); (invocation 1).
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
const result = Math.pow((/* keep */ base), exponent);