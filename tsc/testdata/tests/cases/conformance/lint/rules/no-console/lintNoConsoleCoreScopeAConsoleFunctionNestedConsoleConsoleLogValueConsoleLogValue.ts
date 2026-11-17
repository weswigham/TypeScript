// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeAConsole/function_nested(console)_{_console.log(value);_}_console.log(value); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-console": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function nested(console) { console.log(value); } console.log(value);