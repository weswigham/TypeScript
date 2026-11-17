// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutScopeBehavior/no-implied-eval/function_f(setTimeout,_window)_{_setTimeout('code');_window.setTimeout('code');_} (invocation 1).
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
declare var execScript: any;

// @filename: /input.ts
function f(setTimeout, window) { setTimeout('code'); window.setTimeout('code'); }