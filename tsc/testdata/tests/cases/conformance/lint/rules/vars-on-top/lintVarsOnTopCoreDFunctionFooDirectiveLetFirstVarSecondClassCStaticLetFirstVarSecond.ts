// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDVarsOnTop/vars-on-top/function_foo()_{_'directive';_let_first;_var_second;_}_class_C_{_static_{_let_first;_var_second;_}_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "vars-on-top": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function foo() { 'directive'; let first; var second; } class C { static { let first; var second; } }