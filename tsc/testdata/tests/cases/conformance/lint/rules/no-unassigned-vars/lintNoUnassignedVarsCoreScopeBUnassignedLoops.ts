// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeB/unassigned_loops (invocation 1).
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
let read; for (read of values) use(read); let update; update++; let shorthand; const object = {shorthand};