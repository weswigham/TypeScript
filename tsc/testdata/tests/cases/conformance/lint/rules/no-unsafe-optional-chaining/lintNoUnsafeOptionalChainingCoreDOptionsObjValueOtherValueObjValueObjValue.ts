// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUnsafeOptionalChainingOptions/no-unsafe-optional-chaining/obj?.value_+_other;_value_+=_obj?.value;_+obj?.value; (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-unsafe-optional-chaining": [
                "error",
                {
                    "disallowArithmeticOperators": true
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
obj?.value + other; value += obj?.value; +obj?.value;