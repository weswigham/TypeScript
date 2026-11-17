// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCReports/prefer-promise-reject-errors/new_Promise((resolve,_reject)_=>_{_reject('bad');_(()_=>_reject(0))();_function_f(reject)_{_reject('ok');_}_}); (invocation 2).
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
new Promise((resolve, reject) => { reject('bad'); (() => reject(0))(); function f(reject) { reject('ok'); } });