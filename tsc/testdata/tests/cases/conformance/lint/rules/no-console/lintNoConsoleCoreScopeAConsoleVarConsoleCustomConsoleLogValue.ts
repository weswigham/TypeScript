// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeAConsole/var_console_=_custom;_console.log(value); (invocation 1).
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
var console = custom; console.log(value);