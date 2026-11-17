// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutFlowUpstream/constructor-super/31 (invocation 2).
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
class A extends B { constructor(a) { super(); for (const b of a) { this.a(); } } }