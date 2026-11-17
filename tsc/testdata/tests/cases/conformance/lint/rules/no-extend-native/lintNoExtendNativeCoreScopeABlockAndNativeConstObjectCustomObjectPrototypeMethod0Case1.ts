// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeABlockAndNative/no-extend-native/{_const_Object_=_custom;_Object.prototype.method_=_0;_} (invocation 1).
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
{ const Object = custom; Object.prototype.method = 0; }