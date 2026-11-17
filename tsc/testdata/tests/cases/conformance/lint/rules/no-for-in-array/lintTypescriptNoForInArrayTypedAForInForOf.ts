// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypedAForIn/for_of (invocation 1).
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
for (const value of [1, 2]) {}