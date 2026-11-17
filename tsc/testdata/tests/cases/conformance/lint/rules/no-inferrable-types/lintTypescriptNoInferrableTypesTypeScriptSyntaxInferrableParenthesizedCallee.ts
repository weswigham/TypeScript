// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxNoInferrableTypes/inferrable_parenthesized_callee (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-inferrable-types": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
let value: number = (Number)('1');