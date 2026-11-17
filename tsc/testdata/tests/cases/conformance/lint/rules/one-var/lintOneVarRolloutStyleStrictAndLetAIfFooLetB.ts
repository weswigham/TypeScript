// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleStrictAndOneVar/one-var/let_a;_if_(foo)_{_let_b;_} (invocation 1).
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
let a; if (foo) { let b; }