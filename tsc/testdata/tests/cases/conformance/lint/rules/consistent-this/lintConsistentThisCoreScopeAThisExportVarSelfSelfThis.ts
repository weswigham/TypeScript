// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeAThis/export_{};_var_self;_self_=_this; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "consistent-this": [
                "error",
                "self"
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
export {}; var self; self = this;