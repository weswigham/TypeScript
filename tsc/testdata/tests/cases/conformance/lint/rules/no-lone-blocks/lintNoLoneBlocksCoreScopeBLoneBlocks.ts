// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeB/lone_blocks (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-lone-blocks": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
{} { var item; } { let scoped; } function run() { { const only = 1; } } switch (value) { case 1: {} case 2: {} work(); }