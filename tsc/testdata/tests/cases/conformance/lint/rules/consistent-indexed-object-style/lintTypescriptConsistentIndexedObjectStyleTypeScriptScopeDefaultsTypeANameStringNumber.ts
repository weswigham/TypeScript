// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptScopeDefaults/consistent-indexed-object-style/type_A_=_{_[name:_string]:_number_}; (invocation 1).
// Migrated from TestTypeScriptScopeDiagnosticContracts/indexed-object (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/consistent-indexed-object-style": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
type A = { [name: string]: number };