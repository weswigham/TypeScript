// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUnusedLabelsFixes/no-unused-labels/unused:_('directive'); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "jsx": "preserve",
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-unused-labels": "error"
        }
    },
    "files": [
        "input.tsx"
    ]
}
// @filename: /input.tsx
unused: ('directive');