// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxNoEmptyFunction/constructor_properties (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-empty-function": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
class Item { constructor(public value: number) {} }