// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUselessRenameFixes/no-useless-rename/({_foo:_(foo)_}_=_object); (invocation 1).
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
({ foo: (foo) } = object);