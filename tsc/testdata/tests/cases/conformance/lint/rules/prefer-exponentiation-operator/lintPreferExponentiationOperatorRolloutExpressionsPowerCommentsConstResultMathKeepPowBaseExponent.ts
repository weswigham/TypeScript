// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutExpressionsPowerComments/const_result_=_Math_/*_keep_*/_.pow(base,_exponent); (invocation 1).
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
const result = Math /* keep */ .pow(base, exponent);