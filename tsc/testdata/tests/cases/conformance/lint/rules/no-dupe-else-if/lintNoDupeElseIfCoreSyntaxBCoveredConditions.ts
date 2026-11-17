// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoDupeElseIf/covered_conditions (invocation 1).
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
if (a) {} else if (b) {} else if (a || b) {} else if (c) {}