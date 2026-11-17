// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUnsafe/enum_unsafe (invocation 1).
// Migrated from TestRolloutUnsafeSpans/no-unsafe-enum-assignmentfruit:_Fruit_=_0 (invocation 1).
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
enum Fruit { Apple } const fruit: Fruit = 0;