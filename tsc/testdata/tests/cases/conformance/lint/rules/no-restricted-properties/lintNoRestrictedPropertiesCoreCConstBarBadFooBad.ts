// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCNoRestrictedProperties/const_{bar:_{bad}_=_{}}_=_foo;_({bad})_=>_{}; (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-restricted-properties": [
                "error",
                {
                    "property": "bad"
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const {bar: {bad} = {}} = foo; ({bad}) => {};