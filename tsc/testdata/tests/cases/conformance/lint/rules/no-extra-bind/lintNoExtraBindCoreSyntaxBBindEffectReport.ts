// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoExtraBind/bind_effect_report (invocation 1).
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
const first = function() {}.bind(work()); const second = function() {}.bind(value, other);