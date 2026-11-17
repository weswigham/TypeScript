// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeAComplexity/function_test()_{_if_(a)_{}_while_(b)_{}_for_(;;)_{}_} (invocation 1).
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
function test() { if (a) {} while (b) {} for (;;) {} }