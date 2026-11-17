// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestNoUnreachableInstanceFields/class_B_extends_A_{_x;_constructor()_{_class_C_extends_D_{_[super().x];_constructor()_{}_}_}_} (invocation 1).
// Migrated from TestRolloutFlowUpstream/no-unreachable/559 (invocation 2).
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
class B extends A { x; constructor() { class C extends D { [super().x]; constructor() {} } } }