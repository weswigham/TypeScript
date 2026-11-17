// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCNoSequences/if_(a(),_b)_{} (invocation 2).
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
if (a(), b) {}