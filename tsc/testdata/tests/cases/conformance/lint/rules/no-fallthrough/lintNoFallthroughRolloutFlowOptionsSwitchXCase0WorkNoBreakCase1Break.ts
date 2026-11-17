// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutFlowOptions/no-fallthrough/switch(x)_{_case_0:_work();_/*_no_break_*/_case_1:_break;_} (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-fallthrough": [
                "error",
                {
                    "commentPattern": "no break"
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
switch(x) { case 0: work(); /* no break */ case 1: break; }