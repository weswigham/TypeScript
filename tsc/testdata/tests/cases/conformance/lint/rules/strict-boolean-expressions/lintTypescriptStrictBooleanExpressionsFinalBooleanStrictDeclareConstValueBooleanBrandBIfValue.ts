// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalBooleanStrict/declare_const_value:_boolean_&_{_brand:_'b'_};_if_(value)_{} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/strict-boolean-expressions": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
declare const value: boolean & { brand: 'b' }; if (value) {}