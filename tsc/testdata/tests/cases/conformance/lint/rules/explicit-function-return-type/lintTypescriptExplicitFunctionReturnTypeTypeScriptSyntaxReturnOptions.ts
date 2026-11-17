// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxExplicitFunctionReturnType/return_options (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/explicit-function-return-type": [
                "error",
                {
                    "allowConciseArrowFunctionExpressionsStartingWithVoid": true,
                    "allowedNames": [
                        "allowed"
                    ]
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function allowed() {} const run = () => void work();