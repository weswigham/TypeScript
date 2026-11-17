// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUnsafeFlow/return_async_unknown (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-unsafe-return": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
async function get(): Promise<unknown> { return Promise.resolve(1 as any); }