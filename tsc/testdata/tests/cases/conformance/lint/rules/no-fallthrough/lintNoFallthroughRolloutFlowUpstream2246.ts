// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutFlowUpstream/no-fallthrough/2246 (invocation 2).
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
        break;
}

function f() {
    switch(foo){
        /* falls through comment should not false positive */
        case 1:
            if (a) {
                throw new Error();
            } else if (b) {
                break;
            } else {
                return;
            }
        case 2:
            break;
    }
}
            