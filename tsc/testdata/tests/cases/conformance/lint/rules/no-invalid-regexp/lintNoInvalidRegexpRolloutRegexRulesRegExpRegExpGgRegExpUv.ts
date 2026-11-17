// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutRegexRules/no-invalid-regexp/RegExp("[");_RegExp(".","gg");_RegExp(".","uv"); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-invalid-regexp": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
RegExp("["); RegExp(".","gg"); RegExp(".","uv");