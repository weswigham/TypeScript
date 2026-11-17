// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoAwaitInLoop/await_resources (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-await-in-loop": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
async function run() { while (true) { await using resource = acquire(); } for (await using resource of resources) {} }