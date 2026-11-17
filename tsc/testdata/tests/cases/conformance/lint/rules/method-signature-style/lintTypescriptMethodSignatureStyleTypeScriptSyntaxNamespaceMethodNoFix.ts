// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxMethodSignatureStyle/namespace_method_no_fix (invocation 1).
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
namespace Space { interface Item { run(): void; } }