// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutBindingsRules/deny_attributes (invocation 1).
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
                "bad",
                "with"
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
import value from 'mod' with { bad: 'value' }; import('mod', {with: {bad}});