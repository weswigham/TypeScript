// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxA/default_order (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "default-case-last": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
switch (value) { default: break; case 1: break; }