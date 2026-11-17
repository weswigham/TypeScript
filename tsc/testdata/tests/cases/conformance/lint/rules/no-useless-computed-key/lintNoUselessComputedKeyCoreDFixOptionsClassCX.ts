// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUselessComputedKeyFixOptions/no-useless-computed-key/class_C_{_['x']()_{}_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "jsx": "preserve",
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-useless-computed-key": [
                "error",
                {
                    "enforceForClassMembers": false
                }
            ]
        }
    },
    "files": [
        "input.tsx"
    ]
}
// @filename: /input.tsx
class C { ['x']() {} }