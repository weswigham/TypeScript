// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCSymbolDescription/Symbol();_{_let_Symbol;_Symbol();_} (invocation 1).
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
Symbol(); { let Symbol; Symbol(); }