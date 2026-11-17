// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalSimplifyReturn/function_f(flag:_boolean):_number_|_void_{_if_(flag)_return_1;_return;_} (invocation 1).
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
function f(flag: boolean): number | void { if (flag) return 1; return; }