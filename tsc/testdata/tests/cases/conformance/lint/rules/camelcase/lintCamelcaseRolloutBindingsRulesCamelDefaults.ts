// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutBindingsRules/camel_defaults (invocation 1).
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
const snake_case = 1; snake_case++; use(snake_case); snake_case();