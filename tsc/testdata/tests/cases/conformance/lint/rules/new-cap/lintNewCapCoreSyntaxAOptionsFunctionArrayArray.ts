// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxAOptions/new-cap/function_Array()_{}_Array(); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "new-cap": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function Array() {} Array();