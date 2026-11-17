// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoIrregularWhitespace/irregular_options (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-irregular-whitespace": [
                "error",
                {
                    "skipComments": true,
                    "skipRegExps": true,
                    "skipStrings": false,
                    "skipTemplates": true
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const value = ' '; // 
const template = ` `; const pattern = / /;