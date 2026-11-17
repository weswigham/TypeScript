// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxNoUselessEmptyExport/empty_export (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-useless-empty-export": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
export const value = 1; export {};