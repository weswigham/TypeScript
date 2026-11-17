// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutRegexFixesAndOptions/prefer-named-capture-group/const_re_=_/(a)/; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "prefer-named-capture-group": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const re = /(a)/;