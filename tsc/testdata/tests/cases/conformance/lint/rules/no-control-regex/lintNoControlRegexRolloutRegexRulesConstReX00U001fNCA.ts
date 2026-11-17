// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutRegexRules/no-control-regex/const_re_=_/\x00\u001f\n\cA/; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-control-regex": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const re = /\x00\u001f\n\cA/;