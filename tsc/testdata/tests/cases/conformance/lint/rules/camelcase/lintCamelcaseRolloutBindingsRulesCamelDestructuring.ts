// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutBindingsRules/camel_destructuring (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "camelcase": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const {snake_case = default_value, source_name: alias_name} = source;