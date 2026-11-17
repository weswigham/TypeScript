// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCReports/no-underscore-dangle/var__first;_const_second__=_0;_function__third()_{}_object._fourth;_object[_fifth];_object['_sixth']; (invocation 2).
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
var _first; const second_ = 0; function _third() {} object._fourth; object[_fifth]; object['_sixth'];