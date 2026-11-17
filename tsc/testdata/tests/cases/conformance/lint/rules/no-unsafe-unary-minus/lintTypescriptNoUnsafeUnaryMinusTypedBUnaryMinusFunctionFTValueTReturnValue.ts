// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypedBUnaryMinus/function_f<T>(value:_T)_{_return_-value;_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-unsafe-unary-minus": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function f<T>(value: T) { return -value; }