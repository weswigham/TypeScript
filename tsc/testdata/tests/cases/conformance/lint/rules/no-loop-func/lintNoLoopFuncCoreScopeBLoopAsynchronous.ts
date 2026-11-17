// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeB/loop_asynchronous (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-loop-func": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
for (var index = 0; index < 3; index++) { (async () => index)(); (function*() { yield index; })(); }