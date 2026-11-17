// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCNoSetterReturn/({set_a(val)_{_return;_function_f()_{_return_1;_}_}}); (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-setter-return": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
({set a(val) { return; function f() { return 1; } }});