// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCFixes/no-undef-init/var_value_=_undefined; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-undef-init": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
var value = undefined;