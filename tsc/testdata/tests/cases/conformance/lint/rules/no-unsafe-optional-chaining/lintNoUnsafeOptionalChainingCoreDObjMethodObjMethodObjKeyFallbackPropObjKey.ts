// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUnsafeOptionalChaining/no-unsafe-optional-chaining/obj?.method();_obj?.method?.();_(obj?.key_??_fallback).prop;_({_...obj?.key_}); (invocation 1).
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
obj?.method(); obj?.method?.(); (obj?.key ?? fallback).prop; ({ ...obj?.key });