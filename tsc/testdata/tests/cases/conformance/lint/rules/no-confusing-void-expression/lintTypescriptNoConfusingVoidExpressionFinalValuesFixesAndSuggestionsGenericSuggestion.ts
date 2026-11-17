// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalValuesNoConfusingVoidExpressionFixesAndSuggestions/generic_suggestion (invocation 1).
// Migrated from TestFinalValuesNoConfusingVoidExpressionOptionsAndRanges/void_wrap_generic (invocation 1).
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
const value = console.log();