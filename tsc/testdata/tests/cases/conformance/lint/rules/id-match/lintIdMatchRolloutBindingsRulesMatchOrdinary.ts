// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutBindingsRules/match_ordinary (invocation 1).
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
                "^[a-z]+$"
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
let bad_name; bad_name = 1; bad_name(bad_name);