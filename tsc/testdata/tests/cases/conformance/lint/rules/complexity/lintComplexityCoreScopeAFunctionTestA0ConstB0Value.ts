// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeAComplexity/function_test(a_=_0)_{_const_[{_b_=_0_}_=_{}]_=_value;_} (invocation 1).
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
function test(a = 0) { const [{ b = 0 } = {}] = value; }