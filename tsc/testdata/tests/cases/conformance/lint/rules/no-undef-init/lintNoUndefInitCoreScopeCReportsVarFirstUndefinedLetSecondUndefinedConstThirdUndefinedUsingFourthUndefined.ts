// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCReports/no-undef-init/var_first_=_undefined;_let_second_=_(undefined);_const_third_=_undefined;_using_fourth_=_undefined; (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-undef-init": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
var first = undefined; let second = (undefined); const third = undefined; using fourth = undefined;