// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutFlowUpstream/no-unreachable-loop/615 (invocation 2).
// Upstream source revisions and MIT notices: ../../UPSTREAM-LICENSE.txt.
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-unreachable-loop": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function someFunc() { while (a && b) while (foo) if (bar) return; }