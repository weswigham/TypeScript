// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutFlow/finally_break (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-fallthrough": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
switch (x) { case 0: try { work(); } finally { break; } case 1: break; }