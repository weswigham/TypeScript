// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutBindingsRules/camel_quoted_exports (invocation 1).
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
export {value as 'snake_case'}; export * as 'other_name' from 'mod';