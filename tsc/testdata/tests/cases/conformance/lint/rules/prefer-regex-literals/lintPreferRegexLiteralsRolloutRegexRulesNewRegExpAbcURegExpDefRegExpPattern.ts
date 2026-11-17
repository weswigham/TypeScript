// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutRegexRules/prefer-regex-literals/new_RegExp('abc',_'u');_RegExp(`def`);_RegExp(pattern); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "prefer-regex-literals": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
new RegExp('abc', 'u'); RegExp(`def`); RegExp(pattern);