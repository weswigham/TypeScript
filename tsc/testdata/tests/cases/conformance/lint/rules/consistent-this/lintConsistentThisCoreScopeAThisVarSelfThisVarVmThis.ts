// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeAThis/var_self_=_this;_var_vm_=_this; (invocation 1).
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
                "self",
                "vm"
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
var self = this; var vm = this;