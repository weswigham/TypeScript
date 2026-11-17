// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUselessComputedKeyFixes/no-useless-computed-key/({_['__proto__']:_value_}_=_source); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "jsx": "preserve",
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-useless-computed-key": "error"
        }
    },
    "files": [
        "input.tsx"
    ]
}
// @filename: /input.tsx
({ ['__proto__']: value } = source);