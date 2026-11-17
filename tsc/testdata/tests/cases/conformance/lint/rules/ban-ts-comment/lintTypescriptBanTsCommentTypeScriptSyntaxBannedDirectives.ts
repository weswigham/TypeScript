// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxBanTsComment/banned_directives (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/ban-ts-comment": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
// @ts-ignore
const value = 1;
// @ts-expect-error
work();