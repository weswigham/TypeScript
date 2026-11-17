// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDPreferNumericLiteralsFixes/prefer-numeric-literals/parseInt('11',_2);_Number.parseInt(`67`,_8); (invocation 1).
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
parseInt('11', 2); Number.parseInt(`67`, 8);