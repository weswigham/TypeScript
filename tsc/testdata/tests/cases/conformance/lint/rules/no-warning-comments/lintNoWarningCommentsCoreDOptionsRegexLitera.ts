// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoWarningCommentsOptions/no-warning-comments///_regex_[litera|$] (invocation 2).
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
                    "location": "anywhere",
                    "terms": [
                        "[litera|$]"
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
// regex [litera|$]