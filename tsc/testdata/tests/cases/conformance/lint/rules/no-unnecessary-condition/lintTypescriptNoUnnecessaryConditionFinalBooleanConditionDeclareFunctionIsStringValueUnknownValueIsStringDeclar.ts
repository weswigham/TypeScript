// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalBooleanCondition/declare_function_isString(value:_unknown):_value_is_string;_declare_const_value:_string;_isString(value); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-unnecessary-condition": [
                "error",
                {
                    "checkTypePredicates": true
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
declare function isString(value: unknown): value is string; declare const value: string; isString(value);