// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutExpressionsPower/work()_Math.pow(base_+_other,_exponent); (invocation 1).
// Migrated from TestRolloutExpressionsPowerWrapping/work()_Math.pow(base_+_other,_exponent); (invocation 1).
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
work()
Math.pow(base + other, exponent);