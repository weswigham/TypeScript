// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutReturnsMessages/getter-return (invocation 1).
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
class Item { get value() {} }