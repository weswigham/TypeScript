// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxNoWrapperObjectTypes/wrapper_heritage (invocation 1).
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
interface Value extends Number {}