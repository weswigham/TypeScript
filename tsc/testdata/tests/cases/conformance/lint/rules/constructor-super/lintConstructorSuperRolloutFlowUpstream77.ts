// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutFlowUpstream/constructor-super/77 (invocation 2).
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
class Foo extends Bar {
                constructor() {
                    for (a in b) for (c in d);
                }
            }