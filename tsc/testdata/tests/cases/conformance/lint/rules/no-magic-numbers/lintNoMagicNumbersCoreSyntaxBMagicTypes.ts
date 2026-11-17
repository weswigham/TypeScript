// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoMagicNumbers/magic_types (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-magic-numbers": [
                "error",
                {
                    "ignoreClassFieldInitialValues": true,
                    "ignoreDefaultValues": true,
                    "ignoreEnums": true,
                    "ignoreNumericLiteralTypes": true
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
enum Item { Value = 2 } type Value = 1 | -2; function run(value = 3) {} class Other { field = 4; }