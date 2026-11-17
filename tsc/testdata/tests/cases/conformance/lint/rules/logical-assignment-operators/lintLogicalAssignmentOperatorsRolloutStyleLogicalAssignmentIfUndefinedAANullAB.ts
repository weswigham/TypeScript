// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleLogicalAssignment/if_(undefined_===_a_||_a_===_null)_a_=_b (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {},
    "lint": {
        "rules": {
            "logical-assignment-operators": [
                "error",
                "always",
                {
                    "enforceForIfStatements": true
                }
            ]
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
if (undefined === a || a === null) a = b