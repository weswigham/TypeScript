// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypedAMeaninglessVoid/value_call (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-meaningless-void-operator": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
declare function f(): string; void f();