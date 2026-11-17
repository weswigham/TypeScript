// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDRequireYield/require-yield/function*_foo()_{}_function*_bar()_{_yield_0;_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "require-yield": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function* foo() {} function* bar() { yield 0; }