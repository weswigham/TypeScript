// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeAFunctionNames/const_value_=_function_named()_{};_const_arrow_=_()_=>_{};_class_C_{_method()_{}_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "func-names": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const value = function named() {}; const arrow = () => {}; class C { method() {} }