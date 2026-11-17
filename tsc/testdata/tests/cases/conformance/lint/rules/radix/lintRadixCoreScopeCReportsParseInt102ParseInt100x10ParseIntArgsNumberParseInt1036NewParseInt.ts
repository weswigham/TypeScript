// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCReports/radix/parseInt('10',_2);_parseInt('10',_+0x10);_parseInt(...args);_Number?.parseInt('10',_36);_new_parseInt(); (invocation 2).
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
parseInt('10', 2); parseInt('10', +0x10); parseInt(...args); Number?.parseInt('10', 36); new parseInt();