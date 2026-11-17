// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeB/restricted_global_objects (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-restricted-globals": [
                "error",
                {
                    "checkGlobalObject": true,
                    "globals": [
                        "event"
                    ]
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
window.event; globalThis.globalThis['event']; function run(window) { window.event; }