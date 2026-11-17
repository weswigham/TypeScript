// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxBanTslintComment/ban_literals (invocation 1).
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
const text = '// tslint:disable'; const template = `/* tslint:enable */`; const pattern = /tslint:disable/; // mentions tslint:disable
// tslint:disable-line-extra