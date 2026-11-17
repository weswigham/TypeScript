// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalStructuralSpread/class_A_{}_const_a_=_{...A}; (invocation 1).
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
class A {} const a = {...A};