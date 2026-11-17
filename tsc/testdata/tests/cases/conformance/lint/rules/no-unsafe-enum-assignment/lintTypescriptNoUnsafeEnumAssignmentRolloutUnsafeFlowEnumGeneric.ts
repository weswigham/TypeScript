// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUnsafeFlow/enum_generic (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-unsafe-enum-assignment": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
enum Fruit { Apple } const value: Set<Fruit> = new Set<number>();