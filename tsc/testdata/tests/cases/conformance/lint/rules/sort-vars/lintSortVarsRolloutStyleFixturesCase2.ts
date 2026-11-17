// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleFixtures/sort-vars (invocation 2).
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

var alpha = 2, middle = 3, zebra = 1;
let later = compute(), earlier = 0;
const [last, first] = source;