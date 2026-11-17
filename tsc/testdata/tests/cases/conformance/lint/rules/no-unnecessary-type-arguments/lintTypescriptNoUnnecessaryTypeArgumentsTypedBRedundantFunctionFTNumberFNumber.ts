// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypedBRedundant/no-unnecessary-type-arguments/function_f<T_=_number>()_{}_f<number>(); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-unnecessary-type-arguments": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function f<T = number>() {} f<number>();