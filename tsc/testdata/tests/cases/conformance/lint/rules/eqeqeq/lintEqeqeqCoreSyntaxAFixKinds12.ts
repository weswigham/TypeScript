// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxAFixKinds/eqeqeq/1_==_2; (invocation 1).
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
1 == 2;