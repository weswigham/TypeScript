// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoLonelyIf/lonely_if (invocation 1).
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
if (first) {} else { if (second) {} } if (first) if (second) {} else { if (third) {} } else {}