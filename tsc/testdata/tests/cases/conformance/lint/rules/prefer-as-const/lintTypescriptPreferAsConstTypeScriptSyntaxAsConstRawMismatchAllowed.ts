// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxPreferAsConst/as_const_raw_mismatch_allowed (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/prefer-as-const": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const value = 0x10 as 16;