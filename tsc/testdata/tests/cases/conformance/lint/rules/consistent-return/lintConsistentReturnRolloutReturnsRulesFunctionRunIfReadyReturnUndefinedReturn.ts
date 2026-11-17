// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutReturnsRules/consistent-return/function_run()_{_if_(ready)_return_undefined;_return;_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "consistent-return": [
                "error",
                {
                    "treatUndefinedAsUnspecified": true
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function run() { if (ready) return undefined; return; }