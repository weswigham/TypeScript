// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDVarsOnTop/vars-on-top/import_foo_from_'foo';_'directive';_var_first;_export_var_second;_var_third; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "vars-on-top": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
import foo from 'foo'; 'directive'; var first; export var second; var third;