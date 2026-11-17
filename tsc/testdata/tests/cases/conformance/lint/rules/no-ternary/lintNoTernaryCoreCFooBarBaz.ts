// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCNoTernary/foo_?_bar_:_baz (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-ternary": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
foo ? bar : baz