// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutReturnsRules/getter-return/Object.create(null,_{_value:_{_get()_{}_}_}); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "getter-return": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
Object.create(null, { value: { get() {} } });