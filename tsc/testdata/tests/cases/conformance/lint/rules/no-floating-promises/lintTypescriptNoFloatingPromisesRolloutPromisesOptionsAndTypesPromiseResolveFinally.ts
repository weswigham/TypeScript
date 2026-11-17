// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutPromisesOptionsAndTypes/no-floating-promises/Promise.resolve().finally(()_=>_{}); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "jsx": "preserve",
        "lib": [
            "esnext",
            "dom"
        ],
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-floating-promises": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
Promise.resolve().finally(() => {});
export {};