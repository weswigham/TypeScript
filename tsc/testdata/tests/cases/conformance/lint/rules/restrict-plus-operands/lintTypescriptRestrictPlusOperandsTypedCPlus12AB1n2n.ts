// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypedCPlus/1_+_2;_'a'_+_'b';_1n_+_2n; (invocation 1).
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
1 + 2; 'a' + 'b'; 1n + 2n;