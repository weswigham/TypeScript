// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxNoMisusedNew/misused_method (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-misused-new": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
class Value { new(): Value; }