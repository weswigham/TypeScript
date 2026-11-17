// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoEmptyFunctionFixEligibility/function_suggestion (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-empty-function": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function run() {}