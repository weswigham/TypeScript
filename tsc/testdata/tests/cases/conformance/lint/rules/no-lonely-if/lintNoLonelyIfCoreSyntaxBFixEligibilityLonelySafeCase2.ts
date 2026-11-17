// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoLonelyIfFixEligibility/lonely_safe (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-lonely-if": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
if (first) {} else if (second) { }