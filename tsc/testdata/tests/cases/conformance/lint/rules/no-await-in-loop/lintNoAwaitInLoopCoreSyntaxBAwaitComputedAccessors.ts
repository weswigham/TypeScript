// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoAwaitInLoop/await_computed_accessors (invocation 1).
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
async function run() { while (ready) { class Item { get [await getter]() {} set [await setter](value) {} } } }