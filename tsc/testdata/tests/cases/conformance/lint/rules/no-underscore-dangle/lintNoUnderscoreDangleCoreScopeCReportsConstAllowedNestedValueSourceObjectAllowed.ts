// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCReports/no-underscore-dangle/const_{__allowed,_nested:__value_}_=_source;_object._allowed; (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-underscore-dangle": [
                "error",
                {
                    "allow": [
                        "_allowed"
                    ],
                    "allowInObjectDestructuring": false
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const { _allowed, nested: _value } = source; object._allowed;