// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalLibrarySuggestionsAndRanges/declare_const_values:_number[];_(true_?_values.filter(Boolean)_:_values.filter(Boolean))[0]; (invocation 1).
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
declare const values: number[]; (true ? values.filter(Boolean) : values.filter(Boolean))[0];