// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutFlowUpstream/no-fallthrough/2247 (invocation 2).
// Upstream source revisions and MIT notices: ../../UPSTREAM-LICENSE.txt.
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
                    "reportUnusedFallthroughComment": true
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts

switch(foo){
    case 1:
        doSomething();
        // falls through
    case 2: doSomething();
}
          