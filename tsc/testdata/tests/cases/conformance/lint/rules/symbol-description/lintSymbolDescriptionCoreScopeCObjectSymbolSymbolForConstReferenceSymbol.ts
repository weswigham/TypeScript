// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCSymbolDescription/object.Symbol();_Symbol.for();_const_reference_=_Symbol; (invocation 1).
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
object.Symbol(); Symbol.for(); const reference = Symbol;