// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptScopeDefaults/prefer-for-of/for_(let_i_=_0;_i_<_items.length;_i++)_{_use(items[i]);_} (invocation 1).
// Migrated from TestTypeScriptScopeDiagnosticContracts/for-of (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/prefer-for-of": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
for (let i = 0; i < items.length; i++) { use(items[i]); }