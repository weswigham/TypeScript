// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeB/promise_void (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-promise-executor-return": [
                "error",
                {
                    "allowVoid": true
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
new Promise(resolve => void resolve()); new Promise(resolve => { return void resolve(); }); function run(Promise) { new Promise(resolve => resolve()); }