// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutBindingsRules/match_destructure_defaults (invocation 1).
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
const {bad_name = other_name, bad_key: bad_alias} = source;