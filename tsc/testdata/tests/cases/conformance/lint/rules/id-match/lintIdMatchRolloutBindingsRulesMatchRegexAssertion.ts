// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutBindingsRules/match_regex_assertion (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "id-match": [
                "error",
                "^(?!forbidden$)[a-z]+$"
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
let forbidden; let valid;