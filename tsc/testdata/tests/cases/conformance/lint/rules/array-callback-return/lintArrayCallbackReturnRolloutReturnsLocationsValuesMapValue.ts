// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutReturnsLocations/values.map(value_=>_{}); (invocation 1).
// Migrated from TestRolloutReturnsMessages/array-callback-return (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "array-callback-return": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
values.map(value => {});