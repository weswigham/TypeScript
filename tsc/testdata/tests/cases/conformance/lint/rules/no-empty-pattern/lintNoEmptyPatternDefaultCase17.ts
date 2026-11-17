// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestNoEmptyPatternDefault (invocation 17).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-empty-pattern": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
let { other = [] } = source;