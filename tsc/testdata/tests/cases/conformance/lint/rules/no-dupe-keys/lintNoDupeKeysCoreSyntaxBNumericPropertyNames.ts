// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoDupeKeys/numeric_property_names (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-dupe-keys": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const object = { 0x10: 1, 16: 2, 1n: 1, 1: 2, [null]: 1, null: 2 };