// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCFixes/prefer-object-has-own/(Object.prototype.hasOwnProperty.call)(obj,_key); (invocation 1).
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
(Object.prototype.hasOwnProperty.call)(obj, key);