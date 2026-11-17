// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutReturnsMessages/require-await (invocation 1).
// Migrated from TestRolloutReturnsRules/require-await/async_function_run()_{_return_1;_} (invocation 1).
// Migrated from TestRolloutReturnsSuggestions/async_function_run()_{_return_1;_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "require-await": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
async function run() { return 1; }