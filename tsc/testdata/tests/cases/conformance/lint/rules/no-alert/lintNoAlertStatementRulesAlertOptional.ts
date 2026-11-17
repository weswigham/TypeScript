// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestStatementRules/alert_optional (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-alert": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /custom.ts
export default class Custom {}
// @filename: /input.ts
alert?.(); window?.alert(); (window?.alert)();