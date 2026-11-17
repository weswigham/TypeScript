// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutBindingsRules/camel_properties (invocation 1).
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
obj.snake_case = 1; obj.snake_case++; const value = {snake_case: 1}; class C { #snake_case; snake_method() {} }