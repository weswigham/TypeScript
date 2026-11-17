// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeAComplexity/function_outer()_{_class_C_{_[a_||_b]_=_c_||_d;_static_{_e_||_f;_}_method()_{_g_||_h;_}_}_} (invocation 1).
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
function outer() { class C { [a || b] = c || d; static { e || f; } method() { g || h; } } }