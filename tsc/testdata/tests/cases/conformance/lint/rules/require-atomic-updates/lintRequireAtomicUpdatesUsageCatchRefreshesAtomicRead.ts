// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestUsageCatchRefreshesAtomicRead (invocation 1).
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
            "require-atomic-updates": "error"
        }
    },
    "files": [
        "/input.ts",
        "globals.d.ts"
    ]
}
// @filename: /globals.d.ts

// @filename: /input.ts
async function f(shared) { consume(shared.value); try { const result = await task(); shared.value = result; } catch { consume(shared); shared.value = 1; } }