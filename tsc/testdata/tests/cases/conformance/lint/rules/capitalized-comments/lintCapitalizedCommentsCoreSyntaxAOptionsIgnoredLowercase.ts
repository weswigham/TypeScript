// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxAOptions/capitalized-comments///_ignored_//_lowercase (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "capitalized-comments": [
                "error",
                "always",
                {
                    "ignoreConsecutiveComments": true,
                    "ignorePattern": "ignored"
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
// ignored
// lowercase