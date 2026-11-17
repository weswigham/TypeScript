// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutFlowOptions/no-unmodified-loop-condition/let_a_=_0,_b_=_1;_while_(a_?_b_:_false)_{_a++;_} (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-unmodified-loop-condition": [
                "error",
                {
                    "checkConditionalExpressions": true
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
let a = 0, b = 1; while (a ? b : false) { a++; }