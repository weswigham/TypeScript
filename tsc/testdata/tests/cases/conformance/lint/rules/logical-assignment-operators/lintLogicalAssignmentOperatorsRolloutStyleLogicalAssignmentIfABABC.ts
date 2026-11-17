// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleLogicalAssignment/if_(a.b)_a.b_=_c (invocation 1).
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
if (a.b) a.b = c