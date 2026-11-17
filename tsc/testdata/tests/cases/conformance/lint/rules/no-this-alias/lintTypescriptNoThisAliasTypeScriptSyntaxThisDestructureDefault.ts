// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxNoThisAlias/this_destructure_default (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-this-alias": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const { value } = this;