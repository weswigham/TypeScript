// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCNoOctalEscape/'\01\02';_'\0';_'\08';_'\400';_'\\1'; (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-octal-escape": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
'\01\02'; '\0'; '\08'; '\400'; '\\1';