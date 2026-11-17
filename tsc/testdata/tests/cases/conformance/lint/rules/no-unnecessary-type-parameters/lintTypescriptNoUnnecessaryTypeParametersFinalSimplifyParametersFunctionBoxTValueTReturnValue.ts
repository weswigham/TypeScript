// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalSimplifyParameters/function_box<T>(value:_T)_{_return_{_value_};_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-unnecessary-type-parameters": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function box<T>(value: T) { return { value }; }