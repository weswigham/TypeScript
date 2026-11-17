// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxA/arrow_bodies (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "arrow-body-style": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const fn = () => { return 1; }; const empty = () => {};