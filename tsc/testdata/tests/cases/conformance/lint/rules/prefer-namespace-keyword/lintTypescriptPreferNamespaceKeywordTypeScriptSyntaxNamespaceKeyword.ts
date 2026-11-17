// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxPreferNamespaceKeyword/namespace_keyword (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/prefer-namespace-keyword": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
declare module Value {}