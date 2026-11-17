// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCFixes/radix/parseInt('10'); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "radix": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
parseInt('10');