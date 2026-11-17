// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxA/parameters (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "max-params": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function many(first, second, third, fourth) {} function valid(this: void, first, second, third) {}