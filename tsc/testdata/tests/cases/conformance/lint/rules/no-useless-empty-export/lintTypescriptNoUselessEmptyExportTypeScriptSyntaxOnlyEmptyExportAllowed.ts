// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxNoUselessEmptyExport/only_empty_export_allowed (invocation 1).
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
export {}; export {};