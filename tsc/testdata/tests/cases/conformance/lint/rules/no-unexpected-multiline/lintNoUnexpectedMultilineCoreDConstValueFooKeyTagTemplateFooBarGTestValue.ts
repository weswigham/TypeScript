// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUnexpectedMultiline/no-unexpected-multiline/const_value_=_foo_[key];_tag_`template`;_foo__/bar/g.test(value); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-unexpected-multiline": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const value = foo
[key]; tag
`template`; foo
 /bar/g.test(value);