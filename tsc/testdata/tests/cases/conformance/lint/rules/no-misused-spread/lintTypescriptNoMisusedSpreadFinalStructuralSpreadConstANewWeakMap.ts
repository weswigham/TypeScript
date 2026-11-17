// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalStructuralSpread/const_a_=_{...new_WeakMap()}; (invocation 1).
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
            "@typescript-eslint/no-misused-spread": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
const a = {...new WeakMap()};