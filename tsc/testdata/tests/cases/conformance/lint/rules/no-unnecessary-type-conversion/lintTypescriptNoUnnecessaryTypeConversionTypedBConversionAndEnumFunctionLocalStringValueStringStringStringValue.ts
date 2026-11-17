// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypedBConversionAndEnum/no-unnecessary-type-conversion/function_local(String:_(value:_string)_=>_string)_{_String('value');_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-unnecessary-type-conversion": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function local(String: (value: string) => string) { String('value'); }