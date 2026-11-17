// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCNoRestrictedProperties/const_{bar,_baz:_{bar:_nested}}_=_foo;_({bar}_=_foo);_function_f({bar}_=_foo)_{} (invocation 2).
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
const {bar, baz: {bar: nested}} = foo; ({bar} = foo); function f({bar} = foo) {}