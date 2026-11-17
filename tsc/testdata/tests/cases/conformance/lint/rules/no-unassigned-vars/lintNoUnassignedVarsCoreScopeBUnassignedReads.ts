// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeB/unassigned_reads (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-unassigned-vars": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
let read; use(read); let unused; let written; written = 1; use(written); declare let ambient; use(ambient);