// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCReports/prefer-object-has-own/function_local(Object)_{_({}).hasOwnProperty.call(obj,_key);_}_({_x:_1_}).hasOwnProperty.call(obj,_key); (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "prefer-object-has-own": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function local(Object) { ({}).hasOwnProperty.call(obj, key); } ({ x: 1 }).hasOwnProperty.call(obj, key);