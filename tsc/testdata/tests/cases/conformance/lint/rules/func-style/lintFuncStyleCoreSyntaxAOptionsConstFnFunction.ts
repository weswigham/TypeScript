// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxAOptions/func-style/const_fn_=_function()_{}; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "func-style": [
                "error",
                "declaration"
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const fn = function() {};