// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUnsafeOptionalChaining/no-unsafe-optional-chaining/[{_foo_}_=_obj?.bar]_=_[];_[...obj?.list];_function*_foo()_{_yield*_obj?.value;_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-unsafe-optional-chaining": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
[{ foo } = obj?.bar] = []; [...obj?.list]; function* foo() { yield* obj?.value; }