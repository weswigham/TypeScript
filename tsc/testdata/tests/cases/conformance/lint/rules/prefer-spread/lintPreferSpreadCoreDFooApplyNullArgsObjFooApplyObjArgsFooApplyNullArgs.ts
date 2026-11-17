// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDPreferSpread/prefer-spread/foo.apply(null,_args);_obj.foo.apply(obj,_args);_foo['apply'](null,_args); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "prefer-spread": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
foo.apply(null, args); obj.foo.apply(obj, args); foo['apply'](null, args);