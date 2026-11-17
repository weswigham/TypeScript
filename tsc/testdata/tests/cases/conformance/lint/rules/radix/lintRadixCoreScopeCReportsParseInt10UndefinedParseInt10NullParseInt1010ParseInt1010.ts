// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCReports/radix/parseInt('10',_undefined);_parseInt('10',_null);_parseInt('10',_'10');_parseInt('10',_`10`); (invocation 2).
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
parseInt('10', undefined); parseInt('10', null); parseInt('10', '10'); parseInt('10', `10`);