// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestUsageFinallyOverridesCompletion/return; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "jsx": "preserve",
        "module": "esnext",
        "moduleDetection": "legacy",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-useless-assignment": "error"
        }
    },
    "files": [
        "/input.ts",
        "globals.d.ts"
    ]
}
// @filename: /globals.d.ts

// @filename: /input.ts
function f() { let value = 0; try { work(); } finally { consume(value); value = 1; return; } }