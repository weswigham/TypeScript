// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoExtraBooleanCastFixEligibility/boolean_safe (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-extra-boolean-cast": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
if (!!value) {}