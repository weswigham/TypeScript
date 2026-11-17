// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCNoSelfAssign/a.b_=_a['b'];_this.x_=_this.x;_a.b_=_a?.b;_a[b_+_1]_=_a[b_+_1]; (invocation 2).
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
a.b = a['b']; this.x = this.x; a.b = a?.b; a[b + 1] = a[b + 1];