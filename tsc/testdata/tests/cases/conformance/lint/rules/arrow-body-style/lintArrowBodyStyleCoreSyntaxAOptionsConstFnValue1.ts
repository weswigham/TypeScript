// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxAOptions/arrow-body-style/const_fn_=_()_=>_({_value:1_}); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "arrow-body-style": [
                "error",
                "as-needed",
                {
                    "requireReturnForObjectLiteral": true
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const fn = () => ({ value:1 });