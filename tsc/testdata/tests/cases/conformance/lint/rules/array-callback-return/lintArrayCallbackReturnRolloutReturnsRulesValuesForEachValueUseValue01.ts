// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutReturnsRules/array-callback-return/values.forEach(value_=>_use(value));#01 (invocation 1).
// Migrated from TestRolloutReturnsSuggestions/values.forEach(value_=>_use(value)); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "array-callback-return": [
                "error",
                {
                    "checkForEach": true
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
values.forEach(value => use(value));