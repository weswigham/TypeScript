// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUselessRenameFixOptions/no-useless-rename/export_{_foo_as_foo_}; (invocation 1).
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
                    "ignoreExport": true
                }
            ]
        }
    },
    "files": [
        "input.tsx"
    ]
}
// @filename: /input.tsx
export { foo as foo };