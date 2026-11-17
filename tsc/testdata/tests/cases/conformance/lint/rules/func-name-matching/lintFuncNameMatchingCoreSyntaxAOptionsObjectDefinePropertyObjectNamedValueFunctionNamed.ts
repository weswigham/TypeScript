// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxAOptions/func-name-matching/Object.defineProperty(object,_'named',_{_value:_function_named()_{}_}); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "func-name-matching": [
                "error",
                {
                    "considerPropertyDescriptor": true
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
Object.defineProperty(object, 'named', { value: function named() {} });