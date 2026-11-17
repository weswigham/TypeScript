// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptScopeDiagnosticContracts/indexed-object-comments (invocation 1).
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
type A = { /* keep */ [name: string]: number };