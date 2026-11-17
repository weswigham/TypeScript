// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUnsafeFinally/no-unsafe-finally/try_{}_finally_{_label:_while_(true)_{_continue_label;_}_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-unsafe-finally": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
try {} finally { label: while (true) { continue label; } }