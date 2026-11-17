// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxNoInferrableTypes/inferrable_parameter (invocation 1).
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
const fn = (value?: number = 1) => value;