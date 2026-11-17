// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCNoSetterReturn/Object.create({},_{_foo:_{_[`set`]:_val_=>_val_}_});_Object['defineProperty'](foo,_'bar',_{_set:_function_Object()_{_return_1;_}_}); (invocation 2).
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
Object.create({}, { foo: { [`set`]: val => val } }); Object['defineProperty'](foo, 'bar', { set: function Object() { return 1; } });