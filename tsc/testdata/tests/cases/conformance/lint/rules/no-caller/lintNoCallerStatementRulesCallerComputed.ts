// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestStatementRules/caller_computed (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-caller": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /custom.ts
export default class Custom {}
// @filename: /input.ts
arguments['callee']; arguments[`caller`]; arguments[caller]; arguments.length; other.caller;