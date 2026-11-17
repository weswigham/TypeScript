// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleSorting/sort-imports/import_{b,_a,_d,_c}_from_'foo'; (invocation 1).
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
import {b, a, d, c} from 'foo';