// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleDiagnosticMetadata/one-var/Split_'var'_declarations_into_multiple_statements. (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {},
    "lint": {
        "rules": {
            "one-var": [
                "error",
                "never"
            ]
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
var a,b;