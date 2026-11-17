// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoExtraBind/bind_computed_keys (invocation 1).
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
const first = function() { class Item { [this.key] = 1; } }.bind(value);