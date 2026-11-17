// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCNoNestedTernary/(foo_?_bar_:_baz)_?_qux_:_quux (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-nested-ternary": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
(foo ? bar : baz) ? qux : quux