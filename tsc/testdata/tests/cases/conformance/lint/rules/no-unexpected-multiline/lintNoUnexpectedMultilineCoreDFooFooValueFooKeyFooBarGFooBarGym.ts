// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUnexpectedMultiline/no-unexpected-multiline/foo_();_foo_?.(value);_foo?._[key];_foo_/bar/g;_foo_/bar/_gym; (invocation 1).
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
foo
(); foo
?.(value); foo?.
[key]; foo /bar/g; foo
/bar/ gym;