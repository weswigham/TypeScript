// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCNoSetterReturn/Object.defineProperty(foo,_'bar',_{_set:_val_=>_val_}); (invocation 2).
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
Object.defineProperty(foo, 'bar', { set: val => val });