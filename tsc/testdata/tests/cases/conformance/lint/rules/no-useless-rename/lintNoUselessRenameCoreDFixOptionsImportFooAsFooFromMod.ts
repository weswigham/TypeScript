// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUselessRenameFixOptions/no-useless-rename/import_{_foo_as_foo_}_from_'mod'; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "jsx": "preserve",
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-useless-rename": [
                "error",
                {
                    "ignoreImport": true
                }
            ]
        }
    },
    "files": [
        "input.tsx"
    ]
}
// @filename: /input.tsx
import { foo as foo } from 'mod';