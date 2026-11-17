// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoEmpty/empty_blocks (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-empty": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
if (value) {} function run() {} switch (value) {} try {} catch {} class Item { static {} }