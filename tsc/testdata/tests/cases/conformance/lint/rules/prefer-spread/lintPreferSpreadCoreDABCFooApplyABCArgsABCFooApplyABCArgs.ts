// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDPreferSpread/prefer-spread/(a?.b).c.foo.apply(a?.b.c,_args);_a?.b.c.foo.apply((a?.b).c,_args); (invocation 1).
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
(a?.b).c.foo.apply(a?.b.c, args); a?.b.c.foo.apply((a?.b).c, args);