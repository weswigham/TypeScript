// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestNoUnreachableInstanceFields/class_B_extends_A_{_x;_static_y;_z;_static_q;_constructor()_{}_} (invocation 1).
// Migrated from TestRolloutFlowUpstream/no-unreachable/561 (invocation 2).
// Upstream source revisions and MIT notices: ../../UPSTREAM-LICENSE.txt.
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-unreachable": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
class B extends A { x; static y; z; static q; constructor() {} }