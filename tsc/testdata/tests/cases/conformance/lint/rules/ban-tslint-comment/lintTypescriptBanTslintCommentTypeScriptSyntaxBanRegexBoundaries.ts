// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxBanTslintComment/ban_regex_boundaries (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/ban-tslint-comment": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const pattern = /* tslint:disable */ /[/*]tslint:disable/; // tslint:enable
const escaped = /\/\/ tslint:disable/; /* tslint:disable-line */
const ratio = 4 / /* tslint:enable-line */ 2;