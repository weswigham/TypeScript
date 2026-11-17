// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeAFunctionNames/const_value_=_function_named()_{_function_nested(named)_{_return_named();_}_}; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "func-names": [
                "error",
                "never"
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const value = function named() { function nested(named) { return named(); } };