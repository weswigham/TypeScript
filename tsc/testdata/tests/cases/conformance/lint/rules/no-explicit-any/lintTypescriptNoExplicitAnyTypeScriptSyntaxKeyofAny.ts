// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxNoExplicitAny/keyof_any (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-explicit-any": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
type Key = keyof any;