// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalSimplifyDefault/function_f({_value_=_0_}:_{_value:_number_})_{} (invocation 1).
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
function f({ value = 0 }: { value: number }) {}