// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleStrictAndOneVar/one-var/var_foo;_var_bar; (invocation 1).
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
var foo; var bar;