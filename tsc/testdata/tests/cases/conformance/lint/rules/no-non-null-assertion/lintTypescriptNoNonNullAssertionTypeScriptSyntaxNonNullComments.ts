// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxNoNonNullAssertion/non_null_comments (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-non-null-assertion": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
value!
 // comment
 .property;