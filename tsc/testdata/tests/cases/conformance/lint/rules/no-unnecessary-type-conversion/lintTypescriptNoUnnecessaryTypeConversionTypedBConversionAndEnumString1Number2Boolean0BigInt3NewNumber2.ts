// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypedBConversionAndEnum/no-unnecessary-type-conversion/String(1);_Number('2');_Boolean(0);_BigInt(3);_new_Number(2); (invocation 1).
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
String(1); Number('2'); Boolean(0); BigInt(3); new Number(2);