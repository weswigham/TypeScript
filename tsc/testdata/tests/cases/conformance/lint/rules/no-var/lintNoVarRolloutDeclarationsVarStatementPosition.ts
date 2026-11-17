// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutDeclarations/var-statement-position (invocation 1).
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
function f() { if (x) var y = 1; }