// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCReports/no-underscore-dangle/const___=_0;_object.__proto__;_const_fn_=_function__named(_param)_{};_const_{__value_}_=_object; (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-underscore-dangle": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const _ = 0; object.__proto__; const fn = function _named(_param) {}; const { _value } = object;