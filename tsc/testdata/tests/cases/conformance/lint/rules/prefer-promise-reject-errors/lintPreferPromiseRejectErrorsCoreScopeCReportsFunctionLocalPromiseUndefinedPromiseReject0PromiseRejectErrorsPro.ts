// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCReports/prefer-promise-reject-errors/function_local(Promise,_undefined)_{_Promise.reject(0);_}_Promise.reject(...errors);_Promise.reject(value); (invocation 2).
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
function local(Promise, undefined) { Promise.reject(0); } Promise.reject(...errors); Promise.reject(value);