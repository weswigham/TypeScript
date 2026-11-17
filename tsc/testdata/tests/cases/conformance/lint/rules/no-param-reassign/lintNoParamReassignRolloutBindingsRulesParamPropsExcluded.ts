// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutBindingsRules/param_props_excluded (invocation 1).
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
function task(value) { cache(value.prop).prop = 1; cache[value.prop] = 1; (value ? [] : [])[0] = 1; ({[value]: other} = source); }