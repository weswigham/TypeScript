// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutRegexRules/no-control-regex/RegExp("\\x01");_RegExp(pattern); (invocation 1).
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
RegExp("\\x01"); RegExp(pattern);