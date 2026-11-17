// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeAConsole/console.log(value);_{_let_console;_console.log(value);_} (invocation 1).
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
console.log(value); { let console; console.log(value); }