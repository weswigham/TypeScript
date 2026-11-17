// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreAuditGapsSuggestions/no-console/foo()_console.log();_[1].forEach(work); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-console": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
foo()
console.log();
[1].forEach(work);