// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeAConsole/console.warn(value);_console['log'](value);_console[`warn`]();_console[key](); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-console": [
                "error",
                {
                    "allow": [
                        "warn"
                    ]
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
console.warn(value); console['log'](value); console[`warn`](); console[key]();