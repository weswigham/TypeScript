// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutReturnsRemoval/no-useless-return/function_run()_{_return;_function_nested()_{}_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-useless-return": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function run() { return; function nested() {} }