// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeB/import_writes (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-import-assign": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
import value, * as space from 'pkg'; value = 1; space.key++; delete space.key; Object.assign(space, {}); space.key.deep = 1; value.key = 1;