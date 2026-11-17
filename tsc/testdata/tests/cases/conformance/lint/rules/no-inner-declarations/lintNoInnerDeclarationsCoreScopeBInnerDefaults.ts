// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeB/inner_defaults (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-inner-declarations": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
if (ready) { function nested() {} var item; } function run() { function root() {} }