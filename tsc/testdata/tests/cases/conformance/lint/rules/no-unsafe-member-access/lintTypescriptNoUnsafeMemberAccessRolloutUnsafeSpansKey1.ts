// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUnsafeSpans/no-unsafe-member-accesskey_+=_1 (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-unsafe-member-access": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
function get(value: {key: number}, key: any) { value[(key += 1)]; }