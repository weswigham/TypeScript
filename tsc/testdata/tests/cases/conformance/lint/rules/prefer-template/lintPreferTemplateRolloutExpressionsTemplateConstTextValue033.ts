// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutExpressionsTemplate/const_text_=_value_+_'\033'; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "prefer-template": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const text = value + '\033';