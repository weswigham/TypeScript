// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutReturnsRules/array-callback-return/Array.fromAsync(values,_async_value_=>_{}); (invocation 1).
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
Array.fromAsync(values, async value => {});