// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutExpressionsTemplate/const_text_=_'hello_'_+_name_+_'!'; (invocation 1).
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
const text = 'hello ' + name + '!';