// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRegexNoDiv (invocation 4).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-div-regex": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const pattern = new RegExp("=foo");