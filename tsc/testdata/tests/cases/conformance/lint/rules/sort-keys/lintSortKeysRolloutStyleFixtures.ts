// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleFixtures/sort-keys (invocation 1).
// Migrated from TestRolloutStyleFixtures/sort-keys (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {},
    "lint": {
        "rules": {
            "sort-keys": [
                "error",
                "asc",
                {
                    "allowLineSeparatedGroups": true,
                    "caseSensitive": false,
                    "ignoreComputedKeys": true,
                    "natural": true
                }
            ]
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts

const object = { beta: 1, alpha: 2, ...source, item10: 10, item2: 2 };
const nested = { Z: 1, a: 2 };
const computed = { c: 1, [key]: 2, b: 3 };