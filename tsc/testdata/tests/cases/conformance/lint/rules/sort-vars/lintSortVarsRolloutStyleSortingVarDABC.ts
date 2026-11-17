// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleSorting/sort-vars/var_d,_a,_[b,_c]_=_{}; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {},
    "lint": {
        "rules": {
            "sort-vars": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
var d, a, [b, c] = {};