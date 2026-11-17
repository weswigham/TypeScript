// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeAConsole/Console.log(value);_use(console);_console_=_custom; (invocation 1).
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
Console.log(value); use(console); console = custom;