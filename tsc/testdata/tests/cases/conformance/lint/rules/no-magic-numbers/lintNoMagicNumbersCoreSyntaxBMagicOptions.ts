// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoMagicNumbers/magic_options (invocation 1).
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
                    "detectObjects": true,
                    "enforceConst": true,
                    "ignore": [
                        -1,
                        "100n"
                    ],
                    "ignoreArrayIndexes": true,
                    "ignoreReadonlyClassProperties": true,
                    "ignoreTypeIndexes": true
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
let declared = 3; const object = { value: 4 }; array[0]; call(-1, 100n); class Item { readonly value = 5; } type Index = Other[1 | 2];