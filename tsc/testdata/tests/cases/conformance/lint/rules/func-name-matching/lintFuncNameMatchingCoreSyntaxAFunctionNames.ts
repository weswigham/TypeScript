// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxA/function_names (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "func-name-matching": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const foo = function bar() {}; const valid = function valid() {};