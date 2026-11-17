// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoDupeKeys/object_duplicates (invocation 1).
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
const object = { a: 1, ['a']: 2, get pair() {}, set pair(value) {}, get pair() {}, __proto__: null, ['__proto__']: 1 };