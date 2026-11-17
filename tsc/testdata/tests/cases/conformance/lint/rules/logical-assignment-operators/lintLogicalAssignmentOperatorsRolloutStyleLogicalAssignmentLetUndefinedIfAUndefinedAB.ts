// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleLogicalAssignment/{_let_undefined;_if_(a_==_undefined)_a_=_b_} (invocation 1).
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
{ let undefined; if (a == undefined) a = b }