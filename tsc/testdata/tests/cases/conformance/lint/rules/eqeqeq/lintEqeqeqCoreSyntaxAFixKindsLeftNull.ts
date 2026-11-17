// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxAFixKinds/eqeqeq/left_==_null; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "eqeqeq": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
left == null;