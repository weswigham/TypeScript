// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCFixes/prefer-object-has-own/function*_f()_{_yield({}).hasOwnProperty.call(obj,_key);_} (invocation 1).
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
function* f() { yield({}).hasOwnProperty.call(obj, key); }