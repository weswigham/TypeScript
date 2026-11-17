// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleSorting/sort-vars/var_b,_{x}_=_foo(),_a; (invocation 1).
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
var b, {x} = foo(), a;