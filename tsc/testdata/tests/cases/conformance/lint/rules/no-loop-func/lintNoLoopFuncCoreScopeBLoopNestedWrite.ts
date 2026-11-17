// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeB/loop_nested_write (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-loop-func": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
let value; function update() { value = 1; } while (ready) { () => value; }