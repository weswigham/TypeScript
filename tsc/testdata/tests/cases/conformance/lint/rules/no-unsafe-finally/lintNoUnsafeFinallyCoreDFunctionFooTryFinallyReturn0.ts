// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUnsafeFinally/no-unsafe-finally/function_foo()_{_try_{}_finally_{_return_0;_}_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-unsafe-finally": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function foo() { try {} finally { return 0; } }