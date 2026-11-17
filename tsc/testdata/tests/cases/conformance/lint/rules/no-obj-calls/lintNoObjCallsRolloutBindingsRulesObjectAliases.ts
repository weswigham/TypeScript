// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutBindingsRules/object_aliases (invocation 1).
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
const alias = Math; const second = alias; alias(); new second; const {JSON: json} = globalThis; json();