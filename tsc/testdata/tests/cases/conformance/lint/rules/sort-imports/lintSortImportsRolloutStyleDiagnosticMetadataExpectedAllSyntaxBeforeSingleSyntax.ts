// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleDiagnosticMetadata/sort-imports/Expected_'all'_syntax_before_'single'_syntax. (invocation 1).
// Migrated from TestRolloutStyleSorting/sort-imports/import_a_from_'a';_import_*_as_b_from_'b'; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {},
    "lint": {
        "rules": {
            "sort-imports": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
import a from 'a'; import * as b from 'b';