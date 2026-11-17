// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCNoPlusplus/++i;_j--; (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-plusplus": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
++i; j--;