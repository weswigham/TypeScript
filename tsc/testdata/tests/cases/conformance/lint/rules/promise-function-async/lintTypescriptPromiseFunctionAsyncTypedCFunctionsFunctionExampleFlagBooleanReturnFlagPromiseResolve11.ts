// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypedCFunctions/promise-function-async/function_example(flag:_boolean)_{_return_flag_?_Promise.resolve(1)_:_1;_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/promise-function-async": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function example(flag: boolean) { return flag ? Promise.resolve(1) : 1; }