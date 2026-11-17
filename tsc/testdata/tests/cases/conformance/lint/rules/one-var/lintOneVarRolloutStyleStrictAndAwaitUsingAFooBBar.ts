// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleStrictAndOneVar/one-var/await_using_a=foo(),_b=bar(); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {},
    "lint": {
        "rules": {
            "one-var": [
                "error",
                "never"
            ]
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
await using a=foo(), b=bar();