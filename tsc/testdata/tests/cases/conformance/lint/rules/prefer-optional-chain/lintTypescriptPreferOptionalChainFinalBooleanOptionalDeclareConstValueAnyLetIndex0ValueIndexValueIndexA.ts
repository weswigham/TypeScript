// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalBooleanOptional/declare_const_value:_any;_let_index_=_0;_value[index++]_&&_value[index++].a; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/prefer-optional-chain": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
declare const value: any; let index = 0; value[index++] && value[index++].a;