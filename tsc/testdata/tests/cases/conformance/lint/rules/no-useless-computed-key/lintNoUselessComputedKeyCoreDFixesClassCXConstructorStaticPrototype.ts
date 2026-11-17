// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUselessComputedKeyFixes/no-useless-computed-key/class_C_{_['x']()_{}_['constructor']()_{}_static_['prototype']()_{}_} (invocation 1).
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
class C { ['x']() {} ['constructor']() {} static ['prototype']() {} }