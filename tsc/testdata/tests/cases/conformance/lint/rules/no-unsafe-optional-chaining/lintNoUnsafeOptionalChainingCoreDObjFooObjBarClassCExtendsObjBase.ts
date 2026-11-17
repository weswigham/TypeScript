// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUnsafeOptionalChaining/no-unsafe-optional-chaining/(obj?.foo_&&_obj?.bar)();_class_C_extends_obj?.base_{} (invocation 1).
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
(obj?.foo && obj?.bar)(); class C extends obj?.base {}