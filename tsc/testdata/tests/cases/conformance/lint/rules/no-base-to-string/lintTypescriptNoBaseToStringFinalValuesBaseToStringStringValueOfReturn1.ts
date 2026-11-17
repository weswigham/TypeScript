// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalValuesBaseToString/String({_valueOf()_{_return_1;_}_}); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "jsx": "preserve",
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-base-to-string": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
String({ valueOf() { return 1; } });