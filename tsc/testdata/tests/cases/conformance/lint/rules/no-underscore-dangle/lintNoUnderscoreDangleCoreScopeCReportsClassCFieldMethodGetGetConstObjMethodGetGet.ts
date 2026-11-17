// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCReports/no-underscore-dangle/class_C_{_#_field;__method()_{}_get__get()_{}_}_const_obj_=_{__method()_{},_get__get()_{}_}; (invocation 2).
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
                    "enforceInClassFields": true,
                    "enforceInMethodNames": true
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
class C { #_field; _method() {} get _get() {} } const obj = { _method() {}, get _get() {} };