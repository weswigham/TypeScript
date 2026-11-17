// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypedCSuggestions/use-unknown-in-catch-callback-variable/Promise.resolve().catch((error?)_=>_{}); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/use-unknown-in-catch-callback-variable": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
Promise.resolve().catch((error?) => {});