// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxNoImportTypeSideEffects/inline_import_types (invocation 1).
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
import { type First, type Second as Alias } from 'mod';