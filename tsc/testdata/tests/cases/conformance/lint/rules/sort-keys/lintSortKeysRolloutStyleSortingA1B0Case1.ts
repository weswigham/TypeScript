// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleSorting/sort-keys/({_a:_1,_b:_0_}); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {},
    "lint": {
        "rules": {
            "sort-keys": [
                "error",
                "desc"
            ]
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
({ a: 1, b: 0 });