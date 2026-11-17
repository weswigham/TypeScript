// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCReports/radix/parseInt();_parseInt('10');_Number.parseInt('10',_1);_parseInt('10',_+37);_parseInt('10',_2.5); (invocation 2).
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
parseInt(); parseInt('10'); Number.parseInt('10', 1); parseInt('10', +37); parseInt('10', 2.5);