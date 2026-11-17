// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUnusedLabelsFixes/no-unused-labels/call()_unused:_[1].forEach(work); (invocation 1).
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
call()
unused: [1].forEach(work);