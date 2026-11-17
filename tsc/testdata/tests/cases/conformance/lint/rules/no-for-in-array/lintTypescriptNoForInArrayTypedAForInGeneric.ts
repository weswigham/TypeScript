// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypedAForIn/generic (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-for-in-array": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function f<T extends any[]>(arr: T) { for (const key in arr) {} }