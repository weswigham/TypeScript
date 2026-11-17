// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleLogicalAssignment/a[b.c]_||_(a[b.c]_=_d) (invocation 1).
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
a[b.c] || (a[b.c] = d)