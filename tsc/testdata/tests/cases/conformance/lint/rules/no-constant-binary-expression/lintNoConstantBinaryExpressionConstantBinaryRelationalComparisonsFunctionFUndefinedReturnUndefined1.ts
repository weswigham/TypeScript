// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestConstantBinaryRelationalComparisons/function_f(undefined)_{_return_undefined_<_1;_} (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-constant-binary-expression": [
                "error",
                {
                    "checkRelationalComparisons": true
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function f(undefined) { return undefined < 1; }