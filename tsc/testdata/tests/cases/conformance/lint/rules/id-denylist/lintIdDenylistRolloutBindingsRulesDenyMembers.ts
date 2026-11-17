// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutBindingsRules/deny_members (invocation 1).
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
obj.bad; obj.bad(); obj.bad = 1; obj.bad++; for (obj.bad of values) {}