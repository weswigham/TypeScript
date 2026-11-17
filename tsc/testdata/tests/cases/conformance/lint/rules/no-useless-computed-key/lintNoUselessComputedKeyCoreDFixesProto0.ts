// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUselessComputedKeyFixes/no-useless-computed-key/({_['__proto__']:_0_}); (invocation 1).
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
({ ['__proto__']: 0 });