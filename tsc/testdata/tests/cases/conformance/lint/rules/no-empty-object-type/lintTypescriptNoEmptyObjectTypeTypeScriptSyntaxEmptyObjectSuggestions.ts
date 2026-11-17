// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxNoEmptyObjectType/empty_object_suggestions (invocation 1).
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
type Empty = {};