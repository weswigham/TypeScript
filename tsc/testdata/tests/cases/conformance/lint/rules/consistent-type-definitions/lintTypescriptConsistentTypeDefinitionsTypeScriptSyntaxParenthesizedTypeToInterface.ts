// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxConsistentTypeDefinitions/parenthesized_type_to_interface (invocation 1).
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
type Item = (({ value: number }));