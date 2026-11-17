// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxNoImportTypeSideEffects/mixed_import (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-import-type-side-effects": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
import { type First, Second } from 'mod';