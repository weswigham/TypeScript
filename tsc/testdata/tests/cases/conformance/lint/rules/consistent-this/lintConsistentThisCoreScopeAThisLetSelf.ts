// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeAThis/{_let_self;_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "consistent-this": [
                "error",
                "self"
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
{ let self; }