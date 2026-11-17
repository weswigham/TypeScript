// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutRegexRules/no-invalid-regexp/RegExp("\\1");_RegExp("\\1",_"u"); (invocation 1).
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
RegExp("\\1"); RegExp("\\1", "u");