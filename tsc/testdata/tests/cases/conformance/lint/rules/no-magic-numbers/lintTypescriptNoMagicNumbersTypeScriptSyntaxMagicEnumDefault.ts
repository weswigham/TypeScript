// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxNoMagicNumbers/magic_enum_default (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-magic-numbers": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
enum E { A = +1, B = -2 }