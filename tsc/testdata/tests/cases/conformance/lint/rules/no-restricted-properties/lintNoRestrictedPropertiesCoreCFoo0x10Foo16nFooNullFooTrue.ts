// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCNoRestrictedProperties/foo[0x10];_foo[16n];_foo[null];_foo[true]; (invocation 2).
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
                    "property": "16"
                },
                {
                    "property": "null"
                },
                {
                    "property": "true"
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
foo[0x10]; foo[16n]; foo[null]; foo[true];