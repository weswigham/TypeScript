// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalValuesBaseToString/declare_const_value:_{}_|_string;_String(value); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "jsx": "preserve",
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-base-to-string": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
declare const value: {} | string; String(value);