// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutFlow/default_true_loop (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-constant-condition": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
while (true) {}