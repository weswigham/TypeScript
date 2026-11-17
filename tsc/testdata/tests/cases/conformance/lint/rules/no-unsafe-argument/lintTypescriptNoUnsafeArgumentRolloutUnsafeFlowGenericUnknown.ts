// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUnsafeFlow/generic_unknown (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-unsafe-argument": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
declare function take(x: Set<unknown>): void; take(new Set<any>());