// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestStatementRules/function_references (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-new-func": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /custom.ts
export default class Custom {}
// @filename: /input.ts
use(Function); new Class(Function); foo[Function](); use(Function.bind); Function.toString(); Function[call](); new Function.call(); window.Function();