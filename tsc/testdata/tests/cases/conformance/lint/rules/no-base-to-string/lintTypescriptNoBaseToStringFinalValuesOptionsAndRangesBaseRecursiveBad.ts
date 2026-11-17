// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalValuesNoBaseToStringOptionsAndRanges/base_recursive_bad (invocation 1).
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
type Value = {} | Value[]; declare const value: Value; String(value);