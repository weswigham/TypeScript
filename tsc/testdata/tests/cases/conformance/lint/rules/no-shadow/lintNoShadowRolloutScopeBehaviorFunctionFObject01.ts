// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutScopeBehavior/no-shadow/function_f(Object)_{}#01 (invocation 1).
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
            "no-shadow": [
                "error",
                {
                    "builtinGlobals": true
                }
            ]
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
function f(Object) {}