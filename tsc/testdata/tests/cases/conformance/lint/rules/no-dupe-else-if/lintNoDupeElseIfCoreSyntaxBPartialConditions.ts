// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoDupeElseIf/partial_conditions (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-dupe-else-if": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
if (a && b) {} else if (b && a) {} if (a === 1) {} else if (a === (1)) {}