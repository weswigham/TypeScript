// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRegexEmptyCharacterClass (invocation 8).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-empty-character-class": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const pattern = /[\q{}]/v;