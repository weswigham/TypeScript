// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalBooleanCompare/unconstrained_generic (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-unnecessary-boolean-literal-compare": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function test<T>(value: T) { return value !== false; }