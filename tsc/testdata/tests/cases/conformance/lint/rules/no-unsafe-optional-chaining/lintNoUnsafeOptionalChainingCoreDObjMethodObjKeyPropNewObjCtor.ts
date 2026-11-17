// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUnsafeOptionalChaining/no-unsafe-optional-chaining/(obj?.method)();_(obj?.key).prop;_new_(obj?.ctor)(); (invocation 1).
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
(obj?.method)(); (obj?.key).prop; new (obj?.ctor)();