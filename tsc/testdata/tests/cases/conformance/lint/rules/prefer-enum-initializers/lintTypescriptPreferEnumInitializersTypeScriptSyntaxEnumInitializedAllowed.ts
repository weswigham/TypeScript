// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxPreferEnumInitializers/enum_initialized_allowed (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/prefer-enum-initializers": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
enum E { A = 5, B = 'B' }