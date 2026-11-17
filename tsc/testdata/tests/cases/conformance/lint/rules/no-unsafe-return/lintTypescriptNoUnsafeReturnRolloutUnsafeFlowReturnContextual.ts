// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUnsafeFlow/return_contextual (invocation 1).
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
const get: () => Set<string> = () => new Set<any>();