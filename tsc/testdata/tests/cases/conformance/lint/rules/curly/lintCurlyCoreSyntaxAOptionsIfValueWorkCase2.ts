// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxAOptions/curly/if_(value)_work(); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "curly": [
                "error",
                "multi-line"
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
if (value) work();