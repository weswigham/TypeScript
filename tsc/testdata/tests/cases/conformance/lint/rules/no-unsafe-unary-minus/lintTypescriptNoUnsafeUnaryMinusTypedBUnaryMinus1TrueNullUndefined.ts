// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypedBUnaryMinus/-'1';_-true;_-null;_-undefined; (invocation 1).
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
-'1'; -true; -null; -undefined;