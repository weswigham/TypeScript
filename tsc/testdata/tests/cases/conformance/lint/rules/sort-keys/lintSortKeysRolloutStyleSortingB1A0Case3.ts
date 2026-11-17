// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleSorting/sort-keys/({_b:_1,_[a]:_0_}); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {},
    "lint": {
        "rules": {
            "sort-keys": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
({ b: 1, [a]: 0 });