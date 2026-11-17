// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeAFunctionNames/const_value_=_function_named()_{_const_object_=_{_named:_1_};_object.named;_}; (invocation 1).
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
const value = function named() { const object = { named: 1 }; object.named; };