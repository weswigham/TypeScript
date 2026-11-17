// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCReports/no-underscore-dangle/class_C_extends_B_{_f()_{_this._x;_super._y;_this.constructor._z;_other._x;_}_} (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-underscore-dangle": [
                "error",
                {
                    "allowAfterSuper": true,
                    "allowAfterThis": true,
                    "allowAfterThisConstructor": true
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
class C extends B { f() { this._x; super._y; this.constructor._z; other._x; } }