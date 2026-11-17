// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxNoDupeClassMembers/getter_setter_pair (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-dupe-class-members": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
class Item { get value() {} set value(input) {} }