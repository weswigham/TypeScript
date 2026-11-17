// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUnsafeFinally/no-unsafe-finally/outer:_while_(true)_{_try_{}_finally_{_while_(true)_{_continue_outer;_}_}_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-unsafe-finally": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
outer: while (true) { try {} finally { while (true) { continue outer; } } }