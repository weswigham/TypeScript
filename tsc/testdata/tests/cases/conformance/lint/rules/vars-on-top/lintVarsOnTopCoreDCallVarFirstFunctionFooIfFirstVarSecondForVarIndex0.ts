// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDVarsOnTop/vars-on-top/call();_var_first;_function_foo()_{_if_(first)_{_var_second;_}_for_(var_index_=_0;;)_{}_} (invocation 1).
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
call(); var first; function foo() { if (first) { var second; } for (var index = 0;;) {} }