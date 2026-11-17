// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCNoSelfAssign/a[16n]_=_a['16'];_a[1e2]_=_a['100'];_a[null]_=_a['null']; (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-self-assign": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
a[16n] = a['16']; a[1e2] = a['100']; a[null] = a['null'];