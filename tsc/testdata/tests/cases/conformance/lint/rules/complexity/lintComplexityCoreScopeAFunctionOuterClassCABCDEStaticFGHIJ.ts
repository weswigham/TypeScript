// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeAComplexity/function_outer()_{_class_C_{_[a_||_b]_=_c_||_d_||_e;_static_{_f_||_g_||_h;_}_}_i_||_j;_} (invocation 1).
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
function outer() { class C { [a || b] = c || d || e; static { f || g || h; } } i || j; }