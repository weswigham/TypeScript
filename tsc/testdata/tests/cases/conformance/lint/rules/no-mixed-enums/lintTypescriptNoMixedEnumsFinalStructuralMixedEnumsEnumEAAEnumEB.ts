// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalStructuralMixedEnums/enum_E_{_A_=_'a'_}_enum_E_{_B_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "jsx": "preserve",
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-mixed-enums": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
enum E { A = 'a' } enum E { B }