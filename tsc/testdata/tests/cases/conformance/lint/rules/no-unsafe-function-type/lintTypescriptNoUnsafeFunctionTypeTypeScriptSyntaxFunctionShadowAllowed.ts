// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxNoUnsafeFunctionType/function_shadow_allowed (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-unsafe-function-type": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
{ type Function = () => void; let fn: Function; }