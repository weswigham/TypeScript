// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUsageSmoke/no-useless-assignment (invocation 1).
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
function run() { let value = 0; value = 1; return value; }