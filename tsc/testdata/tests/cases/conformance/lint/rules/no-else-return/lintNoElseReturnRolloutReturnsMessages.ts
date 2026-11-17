// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutReturnsMessages/no-else-return (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-else-return": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function run() { if (ready) return 1; else work(); }