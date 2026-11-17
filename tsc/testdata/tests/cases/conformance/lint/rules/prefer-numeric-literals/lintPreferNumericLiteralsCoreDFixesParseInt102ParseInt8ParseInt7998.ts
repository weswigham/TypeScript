// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDPreferNumericLiteralsFixes/prefer-numeric-literals/parseInt('1_0',_2);_parseInt('',_8);_parseInt('799',_8); (invocation 1).
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
parseInt('1_0', 2); parseInt('', 8); parseInt('799', 8);