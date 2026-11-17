// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutDeclarationsNoVar (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-var": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function f() { var value = 1; return value; }