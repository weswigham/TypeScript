// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleStrictAndOneVar/one-var/export_const_foo=1,bar=2; (invocation 1).
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
export const foo=1,bar=2;