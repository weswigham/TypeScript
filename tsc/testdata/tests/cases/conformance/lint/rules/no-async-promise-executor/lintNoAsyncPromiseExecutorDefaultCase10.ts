// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestNoAsyncPromiseExecutorDefault (invocation 10).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-async-promise-executor": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const executor = async () => {}; new Promise(executor)