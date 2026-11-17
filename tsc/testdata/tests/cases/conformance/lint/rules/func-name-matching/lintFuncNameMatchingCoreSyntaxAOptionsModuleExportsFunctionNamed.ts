// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxAOptions/func-name-matching/module.exports_=_function_named()_{}; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "func-name-matching": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
module.exports = function named() {};