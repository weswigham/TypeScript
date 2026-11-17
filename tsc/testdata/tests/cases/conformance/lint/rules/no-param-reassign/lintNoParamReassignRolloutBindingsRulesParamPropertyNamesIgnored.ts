// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutBindingsRules/param_property_names_ignored (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-param-reassign": [
                "error",
                {
                    "ignorePropertyModificationsFor": [
                        "value"
                    ],
                    "props": true
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function task(value) { value.prop = 1; value = 1; }