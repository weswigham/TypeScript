// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalValuesNoConfusingVoidExpressionFixesAndSuggestions/arrow_wrap (invocation 1).
// Migrated from TestFinalValuesNoConfusingVoidExpressionOptionsAndRanges/void_wrap_arrow (invocation 1).
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
            "@typescript-eslint/no-confusing-void-expression": [
                "error",
                {
                    "ignoreVoidOperator": true
                }
            ]
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
() => console.log();