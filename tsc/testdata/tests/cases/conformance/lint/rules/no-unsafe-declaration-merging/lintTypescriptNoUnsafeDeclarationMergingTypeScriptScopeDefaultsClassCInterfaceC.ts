// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptScopeDefaults/no-unsafe-declaration-merging/class_C_{}_interface_C_{} (invocation 1).
// Migrated from TestTypeScriptScopeDiagnosticContracts/unsafe-merging (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-unsafe-declaration-merging": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
class C {} interface C {}