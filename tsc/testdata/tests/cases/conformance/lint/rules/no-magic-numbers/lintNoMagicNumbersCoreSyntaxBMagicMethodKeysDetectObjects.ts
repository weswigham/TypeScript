// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoMagicNumbers/magic_method_keys_detect_objects (invocation 1).
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
                    "detectObjects": true
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const object = { 1() {}, [2]() {} }; class Item { 3() {} [4]() {} }