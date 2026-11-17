// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxAOptions/init-declarations/let_value_=_1;_const_constant_=_1;_for_(let_index_=_0;;)_break; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "init-declarations": [
                "error",
                "never",
                {
                    "ignoreForLoopInit": true
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
let value = 1; const constant = 1; for (let index = 0;;) break;