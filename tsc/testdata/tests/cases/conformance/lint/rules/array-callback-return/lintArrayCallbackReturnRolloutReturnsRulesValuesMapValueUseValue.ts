// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutReturnsRules/array-callback-return/values.map(value_=>_{_use(value);_}); (invocation 1).
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
values.map(value => { use(value); });