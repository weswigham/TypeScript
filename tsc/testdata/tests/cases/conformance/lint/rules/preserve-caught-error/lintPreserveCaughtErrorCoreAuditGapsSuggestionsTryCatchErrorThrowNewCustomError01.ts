// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreAuditGapsSuggestions/preserve-caught-error/try_{}_catch_(error)_{_throw_new_CustomError();_}#01 (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "preserve-caught-error": [
                "error",
                {
                    "errorClassNames": [
                        {
                            "argumentPosition": 1,
                            "name": "CustomError"
                        }
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
try {} catch (error) { throw new CustomError(); }