// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeAComplexity/function_test()_{_a?.b?.();_a_??=_b;_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "complexity": [
                "error",
                3
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function test() { a?.b?.(); a ??= b; }