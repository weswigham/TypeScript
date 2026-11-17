// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypedBConversionAndEnum/no-unnecessary-type-conversion/String('value');_Number(2);_Boolean(true);_BigInt(2n); (invocation 1).
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
String('value'); Number(2); Boolean(true); BigInt(2n);