// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutFlowUpstream/no-fallthrough/2273 (invocation 2).
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

switch (foo) {
    case 0:
        a();
        break;
    /* falls through */
    case 1:
        b();
}