// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeAComplexity/function_test()_{_[a_=_0]_=_values;_({_b_=_0_}_=_value);_} (invocation 1).
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
                2
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function test() { [a = 0] = values; ({ b = 0 } = value); }