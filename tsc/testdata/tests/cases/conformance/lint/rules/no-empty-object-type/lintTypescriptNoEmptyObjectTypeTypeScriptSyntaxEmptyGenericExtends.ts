// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxNoEmptyObjectType/empty_generic_extends (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-empty-object-type": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
interface Empty<T> extends Base<T> {}