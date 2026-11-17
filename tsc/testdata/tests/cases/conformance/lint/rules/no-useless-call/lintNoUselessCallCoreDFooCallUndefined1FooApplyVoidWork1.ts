// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUselessCall/no-useless-call/foo.call(undefined,_1);_foo.apply(void_work(),_[1]); (invocation 1).
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
foo.call(undefined, 1); foo.apply(void work(), [1]);