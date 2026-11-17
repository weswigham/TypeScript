// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxAOptions/func-style/function_fn(value:_number):_void;_function_fn(value)_{} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "func-style": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function fn(value: number): void; function fn(value) {}