// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUselessRenameFixes/no-useless-rename/export_{_''_as_''_}_from_'mod'; (invocation 1).
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
export { '' as '' } from 'mod';