// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCNoSparseArraysRanges (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-sparse-arrays": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
[ 1, /* keep */ , 2]