// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDPreferSpread/prefer-spread/foo.apply(null,_[]);_foo.apply(null,_...args);_foo.apply(other,_args); (invocation 1).
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
foo.apply(null, []); foo.apply(null, ...args); foo.apply(other, args);