// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalLibraryCases/prefer-find/declare_const_arr:_readonly_number[];_arr.filter(Boolean).at('nonsense'_as_any); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/prefer-find": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
declare const arr: readonly number[]; arr.filter(Boolean).at('nonsense' as any);