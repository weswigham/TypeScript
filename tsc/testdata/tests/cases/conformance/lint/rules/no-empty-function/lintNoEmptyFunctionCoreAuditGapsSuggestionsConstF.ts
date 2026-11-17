// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreAuditGapsSuggestions/no-empty-function/const_f_=_()_=>_{}; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-empty-function": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const f = () => {};