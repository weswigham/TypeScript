// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutBindingsRules/match_class_fields_default (invocation 1).
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
class good { bad_name; #bad_name; bad_method() {} #bad_method() {} }