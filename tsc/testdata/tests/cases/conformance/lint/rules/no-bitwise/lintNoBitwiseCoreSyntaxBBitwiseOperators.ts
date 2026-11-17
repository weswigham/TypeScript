// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoBitwise/bitwise_operators (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-bitwise": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
value |= 1; ~value; value >> 1; value ||= 1;