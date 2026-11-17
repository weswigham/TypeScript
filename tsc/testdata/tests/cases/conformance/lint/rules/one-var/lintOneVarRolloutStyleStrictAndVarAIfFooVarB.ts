// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleStrictAndOneVar/one-var/var_a;_if_(foo)_{_var_b;_} (invocation 1).
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
var a; if (foo) { var b; }