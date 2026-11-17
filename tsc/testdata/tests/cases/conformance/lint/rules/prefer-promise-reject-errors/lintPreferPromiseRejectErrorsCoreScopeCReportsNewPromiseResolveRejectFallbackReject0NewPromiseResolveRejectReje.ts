// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCReports/prefer-promise-reject-errors/new_Promise((resolve,_reject_=_fallback)_=>_reject(0));_new_Promise((resolve,_{reject})_=>_reject(0)); (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "prefer-promise-reject-errors": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
new Promise((resolve, reject = fallback) => reject(0)); new Promise((resolve, {reject}) => reject(0));