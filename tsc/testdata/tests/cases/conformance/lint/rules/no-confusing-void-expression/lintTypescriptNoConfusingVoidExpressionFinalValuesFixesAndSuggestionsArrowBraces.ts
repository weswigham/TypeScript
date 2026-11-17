// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalValuesNoConfusingVoidExpressionFixesAndSuggestions/arrow_braces (invocation 1).
// Migrated from TestFinalValuesNoConfusingVoidExpressionOptionsAndRanges/void_arrow (invocation 1).
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
            "@typescript-eslint/no-confusing-void-expression": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
() => console.log();