// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleDiagnosticMetadata/sort-keys/Expected_object_keys_to_be_in_ascending_order._'a'_should_be_before_'b'. (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {},
    "lint": {
        "rules": {
            "sort-keys": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
({ b: 1, [a]: 2 });