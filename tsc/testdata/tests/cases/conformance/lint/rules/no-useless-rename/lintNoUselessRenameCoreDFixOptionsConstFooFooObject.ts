// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUselessRenameFixOptions/no-useless-rename/const_{_foo:_foo_}_=_object; (invocation 1).
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
                    "ignoreDestructuring": true
                }
            ]
        }
    },
    "files": [
        "input.tsx"
    ]
}
// @filename: /input.tsx
const { foo: foo } = object;