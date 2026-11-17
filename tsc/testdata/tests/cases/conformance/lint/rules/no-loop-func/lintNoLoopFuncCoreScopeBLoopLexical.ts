// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeB/loop_lexical (invocation 1).
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
for (let index = 0; index < 3; index++) { const callback = () => index; } const stable = 0; while (ready) { () => stable; }