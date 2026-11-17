// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxNoNamespace/namespace_external (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-namespace": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
declare module 'external' {} declare global {}