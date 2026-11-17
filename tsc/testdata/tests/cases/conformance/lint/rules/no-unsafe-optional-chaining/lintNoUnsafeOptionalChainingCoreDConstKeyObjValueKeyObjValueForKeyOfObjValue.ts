// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUnsafeOptionalChaining/no-unsafe-optional-chaining/const_{_key_}_=_obj?.value;_([key]_=_obj?.value);_for_(key_of_obj?.value)_{} (invocation 1).
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
const { key } = obj?.value; ([key] = obj?.value); for (key of obj?.value) {}