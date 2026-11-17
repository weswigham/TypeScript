// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUnsafeFlow/spread_generic_rest (invocation 1).
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
declare function take(...x: [string, string]): void; declare const values: [string, ...string[]]; take(...values, 1 as any);