// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUselessRenameFixes/no-useless-rename/import_{_'foo'_as_foo_}_from_'mod';_export_{_foo_as_'foo'_}; (invocation 1).
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
import { 'foo' as foo } from 'mod'; export { foo as 'foo' };