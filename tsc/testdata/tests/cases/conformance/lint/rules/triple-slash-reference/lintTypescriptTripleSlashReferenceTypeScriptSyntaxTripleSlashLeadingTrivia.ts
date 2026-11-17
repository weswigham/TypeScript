// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxTripleSlashReference/triple_slash_leading_trivia (invocation 1).
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
 
/* header */
// header
/// <reference path="value" />
const value = 1;