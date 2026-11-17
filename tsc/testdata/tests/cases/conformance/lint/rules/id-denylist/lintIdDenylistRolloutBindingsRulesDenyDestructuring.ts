// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutBindingsRules/deny_destructuring (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "id-denylist": [
                "error",
                "bad"
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const {bad: good, other: bad, nested: {bad: fine}} = source;