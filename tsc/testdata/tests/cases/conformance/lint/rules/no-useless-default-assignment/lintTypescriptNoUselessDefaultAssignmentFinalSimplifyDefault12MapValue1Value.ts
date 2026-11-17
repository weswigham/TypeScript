// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalSimplifyDefault/[1,_2].map((value_=_1)_=>_value); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-useless-default-assignment": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
[1, 2].map((value = 1) => value);