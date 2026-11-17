// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptScopeDiagnosticContracts/record-to-index-signature (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/consistent-indexed-object-style": [
                "error",
                "index-signature"
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
type A = Record<'a' | 'b', number>;