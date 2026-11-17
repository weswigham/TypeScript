// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutScopeEval/const_object_=_{_eval:_1_};_object.eval; (invocation 1).
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
            "no-eval": "error"
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
const object = { eval: 1 }; object.eval;