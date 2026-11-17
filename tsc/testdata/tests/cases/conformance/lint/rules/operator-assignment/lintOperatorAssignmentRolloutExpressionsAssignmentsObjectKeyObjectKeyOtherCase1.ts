// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutExpressionsAssignments/object.key_=_object['key']_+_other; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "operator-assignment": [
                "error",
                "always"
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
object.key = object['key'] + other;