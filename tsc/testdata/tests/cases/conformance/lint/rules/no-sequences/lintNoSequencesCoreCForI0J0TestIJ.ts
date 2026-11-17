// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCNoSequences/for_((i_=_0,_j_=_0);_test;_(i++,_j++))_{} (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-sequences": [
                "error",
                {
                    "allowInParentheses": false
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
for ((i = 0, j = 0); test; (i++, j++)) {}