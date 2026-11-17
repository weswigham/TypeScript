// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxNoUnsafeFunctionType/unsafe_function (invocation 1).
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
let fn: Function;