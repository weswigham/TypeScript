// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypedCArraySort/computed_binding (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/require-array-sort-compare": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
let method = 'sort'; [1, 2][method]();