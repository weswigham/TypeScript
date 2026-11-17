// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestNoUnreachableESLintFlowBoundaries/function_f()_{_class_C_{_static_{_throw_error;_}_}_work();_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-unreachable": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function f() { class C { static { throw error; } } work(); }