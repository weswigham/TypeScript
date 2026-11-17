// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCReports/valid-typeof/typeof_value_===_'strnig';_typeof_value_==_4;_'number'_!==_typeof_value;_typeof_value_==_`bigint`; (invocation 2).
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
typeof value === 'strnig'; typeof value == 4; 'number' !== typeof value; typeof value == `bigint`;