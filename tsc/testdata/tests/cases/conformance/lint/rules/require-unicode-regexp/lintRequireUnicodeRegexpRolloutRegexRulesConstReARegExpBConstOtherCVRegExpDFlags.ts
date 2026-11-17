// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutRegexRules/require-unicode-regexp/const_re_=_/a/;_RegExp("b");_const_other_=_/c/v;_RegExp("d",_flags); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "require-unicode-regexp": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const re = /a/; RegExp("b"); const other = /c/v; RegExp("d", flags);