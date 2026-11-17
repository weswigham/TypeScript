// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDPreferNumericLiteralsFixes/prefer-numeric-literals/function*_foo()_{_yield(Number).parseInt('11',_2);_} (invocation 1).
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
function* foo() { yield(Number).parseInt('11', 2); }