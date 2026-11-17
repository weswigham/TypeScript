// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalValuesRestrictTemplateExpressionsOptionsAndRanges/template_default_primitives (invocation 1).
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
`${1}${true}${null}${undefined}${1n}${/a/}${new Error()}`;