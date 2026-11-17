// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalStructuralConstituents/aliases (invocation 1).
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
            "@typescript-eslint/no-duplicate-type-constituents": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
type A = string; type B = A; type C = A | B;