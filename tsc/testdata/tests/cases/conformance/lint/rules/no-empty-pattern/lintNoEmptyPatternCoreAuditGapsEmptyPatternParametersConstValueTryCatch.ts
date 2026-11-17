// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreAuditGapsEmptyPatternParameters/const_{}_=_value;_try_{}_catch_({})_{} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-empty-pattern": [
                "error",
                {
                    "allowObjectPatternsAsParameters": true
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const {} = value; try {} catch ({}) {}