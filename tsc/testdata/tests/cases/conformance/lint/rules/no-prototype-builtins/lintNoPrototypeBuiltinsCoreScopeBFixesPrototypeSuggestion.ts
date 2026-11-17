// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeBFixes/prototype_suggestion (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-prototype-builtins": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
object.hasOwnProperty('key');