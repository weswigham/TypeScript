// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleSorting/sort-imports/import_a_from_'a';_import_*_as_b_from_'b';#01 (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {},
    "lint": {
        "rules": {
            "sort-imports": [
                "error",
                {
                    "memberSyntaxSortOrder": [
                        "single",
                        "all",
                        "multiple",
                        "none"
                    ]
                }
            ]
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
import a from 'a'; import * as b from 'b';