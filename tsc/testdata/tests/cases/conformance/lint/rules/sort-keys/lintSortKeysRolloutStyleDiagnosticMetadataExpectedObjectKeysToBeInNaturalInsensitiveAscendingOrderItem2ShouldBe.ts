// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleDiagnosticMetadata/sort-keys/Expected_object_keys_to_be_in_natural_insensitive_ascending_order._'Item2'_should_be_before_'item10'. (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {},
    "lint": {
        "rules": {
            "sort-keys": [
                "error",
                "asc",
                {
                    "caseSensitive": false,
                    "natural": true
                }
            ]
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
({ item10: 1, Item2: 2 });