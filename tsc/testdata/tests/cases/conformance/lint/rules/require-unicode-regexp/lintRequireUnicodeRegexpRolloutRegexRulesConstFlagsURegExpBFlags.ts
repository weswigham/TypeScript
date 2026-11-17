// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutRegexRules/require-unicode-regexp/const_flags_=_"u";_RegExp("b",_flags); (invocation 1).
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
const flags = "u"; RegExp("b", flags);