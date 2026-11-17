// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoDupeClassMembers/class_duplicates (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-dupe-class-members": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
class Item { value; value() {} static value() {} get pair() {} set pair(value) {} get pair() {} #value; }