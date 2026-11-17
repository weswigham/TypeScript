// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxMethodSignatureStyle/polymorphic_this_no_fix (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/method-signature-style": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
interface Item { run(): this; }