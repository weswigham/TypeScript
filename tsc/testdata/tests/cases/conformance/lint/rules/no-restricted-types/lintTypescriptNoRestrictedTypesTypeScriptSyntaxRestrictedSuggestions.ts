// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxNoRestrictedTypes/restricted_suggestions (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-restricted-types": [
                "error",
                {
                    "types": {
                        "Bad": {
                            "suggest": [
                                "Good",
                                "Other"
                            ]
                        }
                    }
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
let value: Bad;