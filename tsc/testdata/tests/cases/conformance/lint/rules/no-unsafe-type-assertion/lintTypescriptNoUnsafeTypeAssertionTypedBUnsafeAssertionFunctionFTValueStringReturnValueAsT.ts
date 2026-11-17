// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypedBUnsafeAssertion/function_f<T>(value:_string)_{_return_value_as_T;_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-unsafe-type-assertion": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function f<T>(value: string) { return value as T; }