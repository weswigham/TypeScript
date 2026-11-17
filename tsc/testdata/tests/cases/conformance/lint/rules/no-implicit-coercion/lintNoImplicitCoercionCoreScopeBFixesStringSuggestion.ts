// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeBFixes/string_suggestion (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-implicit-coercion": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
'' + value;