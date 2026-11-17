// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreAEqeqeqFixOutput/line_comments_and_ASI (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "eqeqeq": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
typeof left // Left
=== // Right
"string" // Trailing
next()