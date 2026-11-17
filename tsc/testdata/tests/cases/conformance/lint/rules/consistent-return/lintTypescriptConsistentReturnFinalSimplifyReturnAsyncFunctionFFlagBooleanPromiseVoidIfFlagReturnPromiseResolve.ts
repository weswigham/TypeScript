// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalSimplifyReturn/async_function_f(flag:_boolean):_Promise<void>_{_if_(flag)_return_Promise.resolve();_return;_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/consistent-return": [
                "error",
                {
                    "treatUndefinedAsUnspecified": false
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
async function f(flag: boolean): Promise<void> { if (flag) return Promise.resolve(); return; }