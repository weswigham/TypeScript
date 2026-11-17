// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoExtraBind/bind_nested_boundaries (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-extra-bind": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const first = function() { class Item { field = this; static { this; } } function nested() { this; } }.bind(value);