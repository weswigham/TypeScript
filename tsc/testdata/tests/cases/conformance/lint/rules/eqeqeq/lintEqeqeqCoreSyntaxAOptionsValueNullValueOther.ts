// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxAOptions/eqeqeq/value_==_null;_value_!=_other; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "eqeqeq": [
                "error",
                "allow-null"
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
value == null; value != other;