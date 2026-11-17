// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeAThis/var_foo_=_42,_that_=_this; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "consistent-this": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
var foo = 42, that = this;