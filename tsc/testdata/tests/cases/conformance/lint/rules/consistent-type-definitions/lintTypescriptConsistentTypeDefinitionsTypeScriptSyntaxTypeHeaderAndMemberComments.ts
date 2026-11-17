// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxConsistentTypeDefinitions/type_header_and_member_comments (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/consistent-type-definitions": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
type Item<T = { value: string }> /* header */ = (({ /* member */ value: T }));