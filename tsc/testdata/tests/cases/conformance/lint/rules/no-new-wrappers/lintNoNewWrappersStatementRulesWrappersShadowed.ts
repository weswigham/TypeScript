// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestStatementRules/wrappers_shadowed (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-new-wrappers": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /custom.ts
export default class Custom {}
// @filename: /input.ts
function test(String, Number, Boolean) { new String(); new Number(); new Boolean(); }