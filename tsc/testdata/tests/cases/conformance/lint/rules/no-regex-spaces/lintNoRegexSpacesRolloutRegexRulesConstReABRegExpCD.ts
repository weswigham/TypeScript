// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutRegexRules/no-regex-spaces/const_re_=_/a___b/;_RegExp("c__d"); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-regex-spaces": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const re = /a   b/; RegExp("c  d");