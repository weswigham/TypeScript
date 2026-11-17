// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeAComplexity/function_outer()_{_function_nested()_{_if_(a)_{}_}_function_other()_{_while_(b)_{}_}_} (invocation 1).
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
                1
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function outer() { function nested() { if (a) {} } function other() { while (b) {} } }