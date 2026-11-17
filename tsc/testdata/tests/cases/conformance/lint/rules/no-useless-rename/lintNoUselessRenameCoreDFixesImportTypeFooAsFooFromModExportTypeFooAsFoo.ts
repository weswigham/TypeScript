// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUselessRenameFixes/no-useless-rename/import_{_type_foo_as_foo_}_from_'mod';_export_{_type_foo_as_foo_}; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "jsx": "preserve",
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-useless-rename": "error"
        }
    },
    "files": [
        "input.tsx"
    ]
}
// @filename: /input.tsx
import { type foo as foo } from 'mod'; export { type foo as foo };