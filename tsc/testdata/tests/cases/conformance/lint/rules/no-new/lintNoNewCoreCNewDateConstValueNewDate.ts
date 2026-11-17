// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCNoNew/(new_Date());_const_value_=_new_Date(); (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-new": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
(new Date()); const value = new Date();