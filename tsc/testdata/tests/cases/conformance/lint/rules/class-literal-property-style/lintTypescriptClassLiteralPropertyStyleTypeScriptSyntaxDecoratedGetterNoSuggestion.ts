// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxClassLiteralPropertyStyle/decorated_getter_no_suggestion (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/class-literal-property-style": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
class Item { @decorator get value() { return 1; } }