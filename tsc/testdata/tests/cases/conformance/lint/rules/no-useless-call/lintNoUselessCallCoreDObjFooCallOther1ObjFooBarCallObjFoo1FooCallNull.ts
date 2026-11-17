// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUselessCall/no-useless-call/obj.foo.call(other,_1);_obj?.foo.bar.call(obj.foo,_1);_foo['call'](null); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-useless-call": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
obj.foo.call(other, 1); obj?.foo.bar.call(obj.foo, 1); foo['call'](null);