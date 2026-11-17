// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleLogicalAssignment/a_||_(((a_=_b))) (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {},
    "lint": {
        "rules": {
            "logical-assignment-operators": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
a || (((a = b)))