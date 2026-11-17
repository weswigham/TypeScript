// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutRegexRules/no-useless-backreference/const_re_=_/(?<=(a)\1)/; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-useless-backreference": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const re = /(?<=(a)\1)/;