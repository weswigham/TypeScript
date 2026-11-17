// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoInlineComments/inline_comments (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-inline-comments": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
// standalone
const value = '/*literal*/'; // inline
/* before */ work();
work(); // eslint-disable-line no-alert