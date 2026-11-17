// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestLintReportsFinalLocation/no-with (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {},
    "lint": {
        "rules": {
            "no-with": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
 /* leading comment */ with (object) {}