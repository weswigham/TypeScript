// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutRegexFixesAndOptions/no-regex-spaces/RegExp("a__b"); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-regex-spaces": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
RegExp("a  b");