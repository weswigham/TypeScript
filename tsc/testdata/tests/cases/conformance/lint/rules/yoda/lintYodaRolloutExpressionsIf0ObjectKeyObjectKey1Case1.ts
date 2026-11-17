// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutExpressionsYoda/if_(0_<=_object.key_&&_object['key']_<=_1)_{} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "yoda": [
                "error",
                "never",
                {
                    "exceptRange": true
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
if (0 <= object.key && object['key'] <= 1) {}