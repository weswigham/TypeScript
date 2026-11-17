// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUnsafeFlow/function_construct (invocation 1).
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
interface Value extends Function { (): void } declare const value: Value; new value();