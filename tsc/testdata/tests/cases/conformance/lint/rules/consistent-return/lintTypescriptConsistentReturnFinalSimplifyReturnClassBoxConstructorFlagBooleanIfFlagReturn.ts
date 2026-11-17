// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalSimplifyReturn/class_Box_{_constructor(flag:_boolean)_{_if_(flag)_return_{};_}_} (invocation 1).
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
class Box { constructor(flag: boolean) { if (flag) return {}; } }