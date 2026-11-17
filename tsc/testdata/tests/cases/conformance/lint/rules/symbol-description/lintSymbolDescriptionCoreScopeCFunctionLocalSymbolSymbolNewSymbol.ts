// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCSymbolDescription/function_local(Symbol)_{_Symbol();_new_Symbol();_} (invocation 1).
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
function local(Symbol) { Symbol(); new Symbol(); }