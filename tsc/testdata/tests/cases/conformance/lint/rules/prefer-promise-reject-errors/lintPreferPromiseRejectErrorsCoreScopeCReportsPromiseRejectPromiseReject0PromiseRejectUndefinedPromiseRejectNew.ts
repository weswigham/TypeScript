// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCReports/prefer-promise-reject-errors/Promise.reject();_Promise.reject(0);_Promise['reject'](undefined);_Promise.reject(new_Error()); (invocation 2).
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
Promise.reject(); Promise.reject(0); Promise['reject'](undefined); Promise.reject(new Error());