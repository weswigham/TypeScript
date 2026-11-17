// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCFixes/prefer-object-has-own/Object./*_keep_*/prototype.hasOwnProperty.call(obj,_key); (invocation 1).
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
Object./* keep */prototype.hasOwnProperty.call(obj, key);