// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeB/label_binding (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-label-var": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
let outer; function run(item) { outer: while (true) break outer; item: {} unused: {} }