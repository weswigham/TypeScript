// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalStructuralSpread/const_a_=_{...[1,_2]}; (invocation 1).
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
const a = {...[1, 2]};