// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeAFunctionNames/function_test(value_=_function()_{})_{}_const_{_key:_local_=_function()_{}_}_=_object;_[value_=_function()_{}]_=_array;_({_value_=_function()_{}_}_=_object); (invocation 1).
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
                "as-needed"
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function test(value = function() {}) {} const { key: local = function() {} } = object; [value = function() {}] = array; ({ value = function() {} } = object);