// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoWarningCommentsOptions/no-warning-comments///**TODO_work (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-warning-comments": [
                "error",
                {
                    "decoration": [
                        "*"
                    ],
                    "terms": [
                        "*todo"
                    ]
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
//**TODO work