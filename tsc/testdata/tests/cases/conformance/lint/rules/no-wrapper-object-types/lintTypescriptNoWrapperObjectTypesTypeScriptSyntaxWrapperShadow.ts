// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxNoWrapperObjectTypes/wrapper_shadow (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-wrapper-object-types": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
type Number = 0 | 1; let value: Number;