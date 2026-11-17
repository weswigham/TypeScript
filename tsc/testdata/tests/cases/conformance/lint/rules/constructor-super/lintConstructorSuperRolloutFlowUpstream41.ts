// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutFlowUpstream/constructor-super/41 (invocation 2).
// Upstream source revisions and MIT notices: ../../UPSTREAM-LICENSE.txt.
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "constructor-super": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts

            class A extends Base {
                constructor(list) {
                    for (const a of list) {
                        if (a.foo) {
                            super(a);
                            return;
                        }
                    }
                    super();
                }
            }
        