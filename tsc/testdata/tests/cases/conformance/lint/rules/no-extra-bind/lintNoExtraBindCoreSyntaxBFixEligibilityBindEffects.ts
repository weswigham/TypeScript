// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoExtraBindFixEligibility/bind_effects (invocation 1).
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
const run = function() {}.bind(work());