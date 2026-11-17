// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxBanTslintComment/ban_template_boundaries (invocation 1).
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
const value = /* tslint:disable */ `raw
// tslint:enable
${ /* tslint:disable-line */ `nested ${1 /* tslint:enable-line */ }
/* tslint:disable */` }
// tslint:disable
`; // tslint:enable-next-line