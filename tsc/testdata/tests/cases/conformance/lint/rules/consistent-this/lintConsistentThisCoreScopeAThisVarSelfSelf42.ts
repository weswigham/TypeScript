// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeAThis/var_self;_self_=_42; (invocation 1).
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
var self; self = 42;