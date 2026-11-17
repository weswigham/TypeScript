// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxTripleSlashReference/triple_slash_block_comment_ignored (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/triple-slash-reference": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
/* / <reference path="value" /> */