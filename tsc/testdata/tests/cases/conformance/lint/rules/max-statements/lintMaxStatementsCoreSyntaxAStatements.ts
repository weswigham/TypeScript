// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxA/statements (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "max-statements": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function long() {work();work();work();work();work();work();work();work();work();work();work();}