// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoDupeKeys/object_destructuring (invocation 1).
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
({a: first, a: second} = source); const object = { a: {a: 1}, b: 2 };