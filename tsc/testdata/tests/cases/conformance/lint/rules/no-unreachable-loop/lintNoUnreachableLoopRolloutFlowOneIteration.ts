// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutFlow/one_iteration (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-unreachable-loop": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
for (const x of xs) { return; }