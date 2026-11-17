// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleStrictAndOneVar/one-var/await_using_a=foo();_await_using_b=bar(); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {},
    "lint": {
        "rules": {
            "one-var": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
await using a=foo(); await using b=bar();