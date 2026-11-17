// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypedCPlus/'a'_+_1; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/restrict-plus-operands": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
'a' + 1;