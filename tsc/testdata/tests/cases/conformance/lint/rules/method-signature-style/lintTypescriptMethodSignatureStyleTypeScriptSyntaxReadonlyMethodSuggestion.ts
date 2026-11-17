// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxMethodSignatureStyle/readonly_method_suggestion (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/method-signature-style": [
                "error",
                "method"
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
interface Item { readonly run: () => void; }