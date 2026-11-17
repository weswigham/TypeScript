// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCReports/valid-typeof/(typeof_value)_===_('invalid');_typeof_value_===_`number${suffix}`; (invocation 2).
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
(typeof value) === ('invalid'); typeof value === `number${suffix}`;