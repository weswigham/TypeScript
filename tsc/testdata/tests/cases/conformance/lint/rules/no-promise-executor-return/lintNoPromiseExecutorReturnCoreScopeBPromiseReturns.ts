// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeB/promise_returns (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-promise-executor-return": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
new Promise(resolve => resolve()); new Promise(function(resolve) { if (ready) return 1; function nested() { return 2; } return; });