// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleSorting/sort-imports/import_{_/*_keep_*/_zz,_aa}_from_'foo'; (invocation 1).
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
import { /* keep */ zz, aa} from 'foo';