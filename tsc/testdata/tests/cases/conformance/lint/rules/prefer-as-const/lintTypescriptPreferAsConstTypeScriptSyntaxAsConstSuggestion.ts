// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxPreferAsConst/as_const_suggestion (invocation 1).
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
let value: 1 = 1;