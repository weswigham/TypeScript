// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCNoSequences/a_=>_(doSomething(),_a) (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-sequences": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
a => (doSomething(), a)