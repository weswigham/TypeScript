// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCNoNegatedCondition/if_(!a)_{}_else_if_(b)_{} (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-negated-condition": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
if (!a) {} else if (b) {}