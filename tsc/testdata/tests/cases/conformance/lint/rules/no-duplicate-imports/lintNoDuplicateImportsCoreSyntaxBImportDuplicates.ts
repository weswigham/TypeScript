// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoDuplicateImports/import_duplicates (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-duplicate-imports": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
import * as space from 'pkg'; import {first} from 'pkg'; import {second} from 'pkg';