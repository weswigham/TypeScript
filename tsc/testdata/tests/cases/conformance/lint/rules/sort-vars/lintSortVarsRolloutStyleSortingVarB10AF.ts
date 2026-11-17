// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleSorting/sort-vars/var_b=10,_a=f(); (invocation 1).
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
var b=10, a=f();