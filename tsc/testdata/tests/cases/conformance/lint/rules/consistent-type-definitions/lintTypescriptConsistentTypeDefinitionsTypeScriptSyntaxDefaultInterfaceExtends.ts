// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxConsistentTypeDefinitions/default_interface_extends (invocation 1).
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
export default interface Item<T> extends Base<T> {}