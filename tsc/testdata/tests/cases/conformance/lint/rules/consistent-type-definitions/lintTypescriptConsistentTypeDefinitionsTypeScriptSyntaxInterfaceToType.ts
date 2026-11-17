// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxConsistentTypeDefinitions/interface_to_type (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/consistent-type-definitions": [
                "error",
                "type"
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
interface Item { value: number }