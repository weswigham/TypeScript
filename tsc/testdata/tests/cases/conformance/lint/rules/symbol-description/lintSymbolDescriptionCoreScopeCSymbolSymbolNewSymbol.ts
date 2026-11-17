// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCSymbolDescription/Symbol();_Symbol?.();_new_Symbol(); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "symbol-description": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
Symbol(); Symbol?.(); new Symbol();