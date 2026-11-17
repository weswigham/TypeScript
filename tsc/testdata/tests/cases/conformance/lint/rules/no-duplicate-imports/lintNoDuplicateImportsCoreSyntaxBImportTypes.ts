// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoDuplicateImports/import_types (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-duplicate-imports": [
                "error",
                {
                    "allowSeparateTypeImports": true
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
import type Item from 'pkg'; import type {Other} from 'pkg'; import {value} from 'pkg';