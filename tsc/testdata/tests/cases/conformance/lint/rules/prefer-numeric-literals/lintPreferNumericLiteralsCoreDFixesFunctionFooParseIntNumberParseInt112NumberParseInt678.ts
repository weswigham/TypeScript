// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDPreferNumericLiteralsFixes/prefer-numeric-literals/function_foo(parseInt,_Number)_{_parseInt('11',_2);_Number.parseInt('67',_8);_} (invocation 1).
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
function foo(parseInt, Number) { parseInt('11', 2); Number.parseInt('67', 8); }