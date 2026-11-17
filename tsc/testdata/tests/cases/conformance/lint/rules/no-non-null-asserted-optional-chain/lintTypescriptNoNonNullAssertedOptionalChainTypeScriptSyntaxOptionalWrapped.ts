// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxNoNonNullAssertedOptionalChain/optional_wrapped (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-non-null-asserted-optional-chain": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
(value?.field)!.next;