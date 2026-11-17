// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutBindingsRules/object_members (invocation 1).
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
globalThis.Math(); globalThis['JSON'](); Math.random(); new Intl.Segmenter(); foo.Math();