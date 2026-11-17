// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalBooleanStrict/declare_function_assert(value:_unknown):_asserts_value;_declare_const_value:_string_|_null;_assert(value); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/strict-boolean-expressions": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
declare function assert(value: unknown): asserts value; declare const value: string | null; assert(value);