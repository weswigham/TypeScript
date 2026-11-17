// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCReports/no-underscore-dangle/function_f(_param_=_0,_..._rest)_{}_const_arrow_=_(_arg)_=>_0; (invocation 2).
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
                    "allowFunctionParams": false
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function f(_param = 0, ..._rest) {} const arrow = (_arg) => 0;