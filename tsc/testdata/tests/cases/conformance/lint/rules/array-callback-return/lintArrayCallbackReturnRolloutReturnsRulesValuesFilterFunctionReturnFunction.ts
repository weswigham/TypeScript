// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutReturnsRules/array-callback-return/values.filter((function()_{_return_function()_{};_})()); (invocation 1).
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
values.filter((function() { return function() {}; })());