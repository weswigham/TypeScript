// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCReports/prefer-object-has-own/Object.prototype.hasOwnProperty.call(obj,_key);_({}).hasOwnProperty.call(obj,_key);_Object.hasOwnProperty.call(obj,_key); (invocation 2).
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
Object.prototype.hasOwnProperty.call(obj, key); ({}).hasOwnProperty.call(obj, key); Object.hasOwnProperty.call(obj, key);