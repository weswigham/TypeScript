// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxExplicitFunctionReturnType/higher_order_return (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/explicit-function-return-type": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function outer() { return () => 1; }