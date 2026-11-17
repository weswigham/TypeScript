// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUselessCall/no-useless-call/(obj?.foo).call(obj,_1);_obj?.foo.bar.call(obj?.foo,_1); (invocation 1).
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
(obj?.foo).call(obj, 1); obj?.foo.bar.call(obj?.foo, 1);