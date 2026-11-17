// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCNoSetterReturn/Reflect.defineProperties(foo,_{bar:_{set(val)_{return_1;}}});_Object.defineProperty(foo,_{set(val)_{return_1;}},_'bar'); (invocation 2).
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
Reflect.defineProperties(foo, {bar: {set(val) {return 1;}}}); Object.defineProperty(foo, {set(val) {return 1;}}, 'bar');