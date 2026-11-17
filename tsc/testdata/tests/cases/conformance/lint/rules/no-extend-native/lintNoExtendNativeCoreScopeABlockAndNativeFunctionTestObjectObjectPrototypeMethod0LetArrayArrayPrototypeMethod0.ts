// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeABlockAndNative/no-extend-native/function_test(Object)_{_Object.prototype.method_=_0;_}_{_let_Array;_Array.prototype.method_=_0;_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-extend-native": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function test(Object) { Object.prototype.method = 0; } { let Array; Array.prototype.method = 0; }