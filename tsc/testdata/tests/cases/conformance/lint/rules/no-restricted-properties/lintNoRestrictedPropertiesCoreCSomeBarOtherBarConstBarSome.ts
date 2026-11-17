// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCNoRestrictedProperties/some.bar;_other.bar;_const_{bar}_=_some; (invocation 2).
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
                    "allowObjects": [
                        "some"
                    ],
                    "property": "bar"
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
some.bar; other.bar; const {bar} = some;