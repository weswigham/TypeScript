// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleStrictAndOneVar/one-var/const_a=0;_const_b=1; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {},
    "lint": {
        "rules": {
            "one-var": [
                "error",
                "consecutive"
            ]
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
const a=0; const b=1;