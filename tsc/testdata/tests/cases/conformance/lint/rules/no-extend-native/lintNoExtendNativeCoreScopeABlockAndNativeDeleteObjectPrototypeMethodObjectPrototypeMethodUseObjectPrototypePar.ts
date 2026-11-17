// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeABlockAndNative/no-extend-native/delete_Object.prototype.method;_Object.prototype.method++;_use(Object.prototype);_parseFloat.prototype.method_=_0; (invocation 1).
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
delete Object.prototype.method; Object.prototype.method++; use(Object.prototype); parseFloat.prototype.method = 0;