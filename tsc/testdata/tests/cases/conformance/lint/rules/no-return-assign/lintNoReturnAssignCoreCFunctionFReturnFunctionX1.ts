// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCNoReturnAssign/function_f()_{_return_function()_{_x_=_1;_};_} (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-return-assign": [
                "error",
                "always"
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function f() { return function() { x = 1; }; }