// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDPreferNumericLiteralsFixes/prefer-numeric-literals/Number./*_keep_*/parseInt('11',_2); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "jsx": "preserve",
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "prefer-numeric-literals": "error"
        }
    },
    "files": [
        "input.tsx"
    ]
}
// @filename: /input.tsx
Number./* keep */parseInt('11', 2);