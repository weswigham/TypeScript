// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutBindingsRules/match_default (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "id-match": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
let snake_case; class C { #snake_case; }