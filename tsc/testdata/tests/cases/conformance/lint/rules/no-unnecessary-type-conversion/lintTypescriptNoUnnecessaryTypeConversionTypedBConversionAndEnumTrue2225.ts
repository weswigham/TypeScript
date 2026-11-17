// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypedBConversionAndEnum/no-unnecessary-type-conversion/!!true;_+2;_~~2;_~~2.5; (invocation 1).
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
!!true; +2; ~~2; ~~2.5;