// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxAOptions/max-lines-per-function/(()_=>_{_work();_})(); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "max-lines-per-function": [
                "error",
                1
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
(() => {
work();
})();