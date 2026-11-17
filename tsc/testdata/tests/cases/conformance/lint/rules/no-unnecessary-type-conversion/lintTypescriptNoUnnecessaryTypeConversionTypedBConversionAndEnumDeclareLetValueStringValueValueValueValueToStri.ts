// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypedBConversionAndEnum/no-unnecessary-type-conversion/declare_let_value:_string;_value_+_'';_''_+_value;_value_+=_'';_value.toString(); (invocation 1).
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
declare let value: string; value + ''; '' + value; value += ''; value.toString();