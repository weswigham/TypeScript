// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeABlockAndNative/no-extend-native/{_var_Object_=_custom;_}_Object.prototype.method_=_0; (invocation 1).
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
{ var Object = custom; } Object.prototype.method = 0;