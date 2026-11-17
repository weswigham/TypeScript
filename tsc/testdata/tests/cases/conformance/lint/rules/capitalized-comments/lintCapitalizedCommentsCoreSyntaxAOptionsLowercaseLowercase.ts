// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxAOptions/capitalized-comments///_lowercase_/*_lowercase_*/ (invocation 1).
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
                    "line": {
                        "ignorePattern": "lower"
                    }
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
// lowercase
/* lowercase */