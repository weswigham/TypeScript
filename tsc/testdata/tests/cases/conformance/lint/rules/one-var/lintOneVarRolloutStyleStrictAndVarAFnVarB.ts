// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleStrictAndOneVar/one-var/var_a;_fn();_var_b; (invocation 1).
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
var a; fn(); var b;