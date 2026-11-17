// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypedBUnaryMinus/declare_let_value:_number_|_string;_-value; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-unsafe-unary-minus": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
declare let value: number | string; -value;