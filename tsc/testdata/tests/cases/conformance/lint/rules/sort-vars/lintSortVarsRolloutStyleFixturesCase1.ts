// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleFixtures/sort-vars (invocation 1).
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

var zebra = 1, alpha = 2, middle = 3;
let later = compute(), earlier = 0;
const [last, first] = source;