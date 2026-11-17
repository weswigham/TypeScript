// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUnsafeFlow/function_shadow (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-unsafe-call": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
{ type Function = () => void; declare const value: Function; value(); }