// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCNoRestrictedProperties/foo.bar;_foo['bar'];_foo.baz;_other.bar; (invocation 2).
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
                    "object": "foo",
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
foo.bar; foo['bar']; foo.baz; other.bar;