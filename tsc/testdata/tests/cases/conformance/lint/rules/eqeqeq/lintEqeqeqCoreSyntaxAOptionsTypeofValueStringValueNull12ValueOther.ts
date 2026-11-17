// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxAOptions/eqeqeq/typeof_value_==_'string';_value_==_null;_1_==_2;_value_==_other; (invocation 1).
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
                "smart"
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
typeof value == 'string'; value == null; 1 == 2; value == other;