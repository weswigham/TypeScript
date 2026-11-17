// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalBooleanNullish/declare_const_value:_string_|_null_|_undefined;_value_!==_null_&&_value_!==_undefined_?_value_:_'default'; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/prefer-nullish-coalescing": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
declare const value: string | null | undefined; value !== null && value !== undefined ? value : 'default';