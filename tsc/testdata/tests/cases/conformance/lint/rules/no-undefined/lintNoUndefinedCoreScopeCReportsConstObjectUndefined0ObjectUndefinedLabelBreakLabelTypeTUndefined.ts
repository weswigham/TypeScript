// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCReports/no-undefined/const_object_=_{_undefined:_0_};_object.undefined;_label:_break_label;_type_T_=_undefined; (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-undefined": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const object = { undefined: 0 }; object.undefined; label: break label; type T = undefined;