// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoEmptyFunction/empty_functions_options (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-empty-function": [
                "error",
                {
                    "allow": [
                        "functions",
                        "privateConstructors"
                    ]
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function run() {} const arrow = () => {}; class Item { private constructor() {} }