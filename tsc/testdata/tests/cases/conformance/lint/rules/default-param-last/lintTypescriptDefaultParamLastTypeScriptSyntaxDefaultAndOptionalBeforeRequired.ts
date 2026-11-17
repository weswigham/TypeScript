// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxDefaultParamLast/default_and_optional_before_required (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/default-param-last": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function run(first = 0, second?: string, third: number) {}