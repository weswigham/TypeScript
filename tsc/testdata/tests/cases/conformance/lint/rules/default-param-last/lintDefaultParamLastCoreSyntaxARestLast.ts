// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxA/rest_last (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "default-param-last": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function test(first = 1, ...rest: number[]) {}