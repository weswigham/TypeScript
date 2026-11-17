// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxA/depth (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "max-depth": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
if (a) if (b) if (c) if (d) if (e) work();