// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutExpressionsAssignments/value_=_/*_keep_*/_value_+_other; (invocation 1).
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
value = /* keep */ value + other;