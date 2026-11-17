// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCNoSetterReturn/function_f(Object)_{_Object.defineProperty(foo,_'bar',_{set(val)_{return_1;}});_} (invocation 2).
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
function f(Object) { Object.defineProperty(foo, 'bar', {set(val) {return 1;}}); }