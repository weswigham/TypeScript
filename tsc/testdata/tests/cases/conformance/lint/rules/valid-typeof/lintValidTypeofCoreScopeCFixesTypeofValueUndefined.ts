// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCFixes/valid-typeof/typeof_value_===_undefined; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "valid-typeof": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
typeof value === undefined;