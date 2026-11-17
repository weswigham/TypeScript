// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxBanTslintComment/ban_between_tokens (invocation 1).
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
const /* tslint:disable */ value /* tslint:enable */ = 1;