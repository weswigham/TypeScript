// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreAEqeqeqFixOutput/parenthesized_operands_and_surrounding_comments (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "eqeqeq": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
/* Leading */ ((typeof left) /* Left */ !== /* Right */ ("string")); /* Trailing */