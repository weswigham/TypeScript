// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxNoRestrictedTypes/restricted_default_empty (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-restricted-types": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
let value: Object;