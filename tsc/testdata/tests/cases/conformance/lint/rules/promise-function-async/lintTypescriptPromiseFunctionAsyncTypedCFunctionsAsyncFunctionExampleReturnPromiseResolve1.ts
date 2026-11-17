// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypedCFunctions/promise-function-async/async_function_example()_{_return_Promise.resolve(1);_} (invocation 1).
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
async function example() { return Promise.resolve(1); }