// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxA/function_style (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "func-style": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function named() {} const expr = function() {};