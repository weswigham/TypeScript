// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutBindingsRules/object_calls (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-obj-calls": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
Math(); new JSON(); Intl?.(); Temporal(); globalThis();