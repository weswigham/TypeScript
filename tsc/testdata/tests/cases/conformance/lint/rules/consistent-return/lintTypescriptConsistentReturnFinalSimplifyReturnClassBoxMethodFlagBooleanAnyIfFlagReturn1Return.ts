// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalSimplifyReturn/class_Box_{_method(flag:_boolean):_any_{_if_(flag)_return_1;_return;_}_} (invocation 1).
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
class Box { method(flag: boolean): any { if (flag) return 1; return; } }