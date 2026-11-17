// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUselessComputedKeyFixes/no-useless-computed-key/({_get[2]()_{}_});_class_C_{_static[0];_} (invocation 1).
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
({ get[2]() {} }); class C { static[0]; }