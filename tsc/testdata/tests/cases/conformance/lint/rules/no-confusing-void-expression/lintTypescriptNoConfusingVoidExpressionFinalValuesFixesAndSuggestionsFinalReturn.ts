// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalValuesNoConfusingVoidExpressionFixesAndSuggestions/final_return (invocation 1).
// Migrated from TestFinalValuesNoConfusingVoidExpressionOptionsAndRanges/void_final_return (invocation 1).
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
function fn() { return console.log(); }