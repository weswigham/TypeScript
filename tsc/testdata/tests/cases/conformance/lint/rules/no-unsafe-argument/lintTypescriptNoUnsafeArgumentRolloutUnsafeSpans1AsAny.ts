// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUnsafeSpans/no-unsafe-argument1_as_any (invocation 1).
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
declare function take(value: string): void; take(1 as any);