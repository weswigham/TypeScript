// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutBindingsRules/camel_tolerated (invocation 1).
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
const __value__ = 1; const UPPER_CASE = 1; obj.snake_case; obj.snake_case();