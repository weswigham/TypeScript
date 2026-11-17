// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleLogicalAssignment/if_(a_===_void_0_||_a_===_null)_a_=_b (invocation 1).
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
if (a === void 0 || a === null) a = b