// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalValuesRestrictTemplateExpressionsOptionsAndRanges/template_parenthesized (invocation 1).
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
            "@typescript-eslint/restrict-template-expressions": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
`${({})}`;