// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutExpressionsAssignments/value_=_other_*_value; (invocation 1).
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
value = other * value;