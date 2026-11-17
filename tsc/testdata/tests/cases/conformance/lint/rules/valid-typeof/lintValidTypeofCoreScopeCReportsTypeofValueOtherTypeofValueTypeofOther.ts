// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCReports/valid-typeof/typeof_value_===_other;_typeof_value_===_typeof_other; (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "valid-typeof": [
                "error",
                {
                    "requireStringLiterals": true
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
typeof value === other; typeof value === typeof other;