// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalOwnershipFixes/enum_widening (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/prefer-readonly": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
enum E { A, B } class C { private value = E.A; constructor() { this.value = E.B; } }