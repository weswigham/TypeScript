// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutScopeDiagnosticPreservation/no-implied-eval (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "alwaysStrict": false,
        "module": "esnext",
        "moduleDetection": "legacy",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-implied-eval": "error"
        }
    },
    "files": [
        "/input.ts",
        "globals.d.ts"
    ]
}
// @filename: /globals.d.ts
interface Object {}
interface Function {}
interface Array<T> {}
declare var setTimeout: any;

// @filename: /input.ts
setTimeout('code', 1);